// ── server/src/services/chatService.ts ───────────────────────────────────
// Chat answer-generation service.
// Uses an OpenAI-compatible LLM if LLM_API_KEY is configured,
// otherwise falls back to a local deterministic heuristic.

import { resources, incidents } from '../data/operationalData.js'
import { MUKAMS, buildSiteInfo, type SiteInfo } from '../data/mukamData.js'

// ── Configuration ──────────────────────────────────────────────────────────

const LLM_API_KEY = process.env.LLM_API_KEY || ''
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini'
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1'

// ── Data context builder ───────────────────────────────────────────────────

interface ChatContext {
  query: string
  sites: SiteInfo[]
  global: {
    totalPilgrims: number
    totalResources: number
    activeIncidents: number
    mukams: string[]
  }
}

function buildContext(message: string): ChatContext {
  const sites: SiteInfo[] = MUKAMS.map(m => buildSiteInfo(m))
  const activeIncidents = incidents.filter(i => i.status !== 'resolved').length

  return {
    query: message,
    sites,
    global: {
      totalPilgrims: MUKAMS.reduce((s, m) => s + m.metrics.totalPilgrims, 0),
      totalResources: resources.length,
      activeIncidents,
      mukams: MUKAMS.map(m => m.name),
    },
  }
}

// ── LLM call ───────────────────────────────────────────────────────────────

async function callLLM(context: ChatContext): Promise<string> {
  if (!LLM_API_KEY) {
    throw new Error('NO_LLM_KEY')
  }

  const systemPrompt = `You are the AI assistant for the Pandharpur Wari website.
Answer the user's question using ONLY the supplied website/project data.
Never invent numbers, locations, site names, or statistics.
If the requested information is not present in the supplied data, respond exactly: "Sorry, I couldn't find that information on the website."
Keep answers short, friendly and easy to understand.
If multiple locations match, clearly list them.
Do not use general world knowledge to fill missing website information.`

  const userPrompt = `User question: "${context.query}"

Website data:
${JSON.stringify(context, null, 2)}`

  const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 300,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LLM error ${res.status}: ${text}`)
  }

  const data = await res.json() as { choices?: { message: { content: string } }[] }
  const answer = data.choices?.[0]?.message?.content?.trim()
  if (!answer) throw new Error('Empty LLM response')
  return answer
}

// ── Local heuristic fallback ───────────────────────────────────────────────

function detectLanguage(text: string): 'en' | 'mr' {
  const marathiPattern = /[\u0900-\u097F]/
  return marathiPattern.test(text) ? 'mr' : 'en'
}

function localHeuristic(context: ChatContext): string {
  const q = context.query.toLowerCase()
  const lang = detectLanguage(q)

  const normalized = q
    .replace(/dusbin/g, 'dustbin')
    .replace(/washroom/g, 'toilet')
    .replace(/bathroom/g, 'toilet')
    .replace(/garbage bin/g, 'dustbin')
    .replace(/waste bin/g, 'dustbin')
    .replace(/dust bin/g, 'dustbin')
    .replace(/dust bins/g, 'dustbin')

  const site = context.sites.find(s => {
    const nameParts = s.mukamName.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
    const locParts = s.location.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
    const idLower = s.mukamId.toLowerCase()
    return [...nameParts, ...locParts, idLower].some(part => normalized.includes(part))
  })

  const unknownLocation = !site && /mumbai|delhi|bangalore|chennai|kolkata|hyderabad|pune city|goa|nashik|nagpur/.test(q)

  const allToilets = context.sites.reduce((s, x) => s + x.toilets, 0)
  const allDustbins = context.sites.reduce((s, x) => s + x.dustbins, 0)
  const allHotspots: string[] = []
  context.sites.forEach(s => allHotspots.push(...s.garbageHotspots))

  if (unknownLocation) {
    return lang === 'mr'
      ? 'माझ्या माहितीनुसार या वेबसाइटवर ही माहिती उपलब्ध नाही.'
      : "Sorry, I couldn't find that information on the website."
  }

  // What information is available
  if (/what (other )?information|what data|provide.*info|tell me about|माहिती/.test(normalized)) {
    if (lang === 'mr') {
      return 'या वेबसाइटवर टॉयलेट, कचरेचे बूच, भीड, हॉटस्पॉट, सफाई स्थिती, स्थलनाम आणि संसाधनांची माहिती उपलब्ध आहे.'
    }
    return 'This website provides information about toilets, dustbins, crowd, garbage hotspots, sanitation status, site locations, and resources.'
  }

  // Toilet requirement based on crowd
  if (/toilet.*required|need.*toilet|required.*toilet|how many.*toilet.*based/.test(normalized)) {
    if (site) {
      const totalCrowd = site.totalPilgrims
      const recommended = Math.ceil(totalCrowd / 500)
      return lang === 'mr'
        ? `${site.mukamName} मध्ये ${totalCrowd.toLocaleString('en-IN')} यात्री असल्याने सुचवलेले टॉयलेट संख्या ~${recommended} आहे.`
        : `Based on ${totalCrowd.toLocaleString('en-IN')} pilgrims at ${site.mukamName}, approximately ${recommended} toilets are recommended.`
    }
    const total = context.global.totalPilgrims
    const recommended = Math.ceil(total / 500)
    return lang === 'mr'
      ? `एकूण ${total.toLocaleString('en-IN')} यात्री असल्याने सुचवलेले टॉयलेट संख्या ~${recommended} आहे.`
      : `Based on ${total.toLocaleString('en-IN')} total pilgrims, approximately ${recommended} toilets are recommended.`
  }

  // Toilet questions
  if (/toilet|toilets|टॉयलेट|शौचालय|washroom|bathroom/.test(normalized)) {
    if (site) {
      return lang === 'mr'
        ? `${site.mukamName} मध्ये ${site.toilets} टॉयलेट उपलब्ध आहेत.`
        : `${site.mukamName} currently has ${site.toilets} toilets available.`
    }
    return lang === 'mr'
      ? `सर्व साइटमध्ये एकूण ${allToilets} टॉयलेट उपलब्ध आहेत.`
      : `There are a total of ${allToilets} toilets available across all sites.`
  }

  // Cleaning workers / sanitation workers
  if (/worker|cleaner|cleaning|staff|कामगार/.test(normalized)) {
    if (site) {
      const rec = Math.max(1, Math.ceil(site.totalPilgrims / 2000))
      return lang === 'mr'
        ? `${site.mukamName} साठी सुचवलेले सफाई कामगार संख्या ~${rec} आहे.`
        : `Approximately ${rec} cleaning workers are recommended for ${site.mukamName}.`
    }
    const rec = Math.max(1, Math.ceil(context.global.totalPilgrims / 2000))
    return lang === 'mr'
      ? `एकूण साठी सुचवलेले सफाई कामगार संख्या ~${rec} आहे.`
      : `Approximately ${rec} cleaning workers are recommended across all sites.`
  }

  // Sanitation info for a site
  if (/sanitation|सफाई|शौच/.test(normalized)) {
    if (site) {
      return lang === 'mr'
        ? `${site.mukamName}: ${site.toilets} टॉयलेट, ${site.dustbins} कचरेचे बूच, ${site.mobileUnits} मोबाइल युनिट. सफाई स्थिती: ${site.sanitationStatus}.`
        : `${site.mukamName}: ${site.toilets} toilets, ${site.dustbins} dustbins, ${site.mobileUnits} mobile units. Sanitation status: ${site.sanitationStatus}.`
    }
    return lang === 'mr'
      ? 'सध्या सर्व मुकाममध्ये सफाई स्थिती लक्षात घेता येईल. कृपया विशिष्ट मुकाम न संपर्ग करा.'
      : 'Sanitation status is available for each Mukam. Please ask about a specific site.'
  }

  // Dustbin questions
  if (/dustbin|dump|waste point|कचरेचे बूच|कचरा बूच|garbage bin|waste bin/.test(normalized)) {
    if (site) {
      return lang === 'mr'
        ? `${site.mukamName} मध्ये ${site.dustbins} कचरेचे बूच उपलब्ध आहेत.`
        : `${site.mukamName} currently has ${site.dustbins} dustbins available.`
    }
    if (/where|which area|most/.test(normalized)) {
      const max = context.sites.reduce((a, b) => a.dustbins > b.dustbins ? a : b)
      const tied = context.sites.filter(s => s.dustbins === max.dustbins)
      if (tied.length > 1) {
        return lang === 'mr'
          ? `${tied.map(t => t.mukamName).join(', ')} मध्ये सर्वात जास्त ${max.dustbins} कचरेचे बूच आहेत.`
          : `${tied.map(t => t.mukamName).join(', ')} have the most dustbins with ${max.dustbins} each.`
      }
      return lang === 'mr'
        ? `${max.mukamName} मध्ये सर्वात जास्त ${max.dustbins} कचरेचे बूच आहेत.`
        : `${max.mukamName} has the most dustbins with ${max.dustbins}.`
    }
    return lang === 'mr'
      ? `सर्व साइटमध्ये एकूण ${allDustbins} कचरेचे बूच आहेत.`
      : `There are a total of ${allDustbins} dustbins across all sites.`
  }

  // Garbage hotspot questions
  if (/garbage hotspot|hotspot|dirty|कचरा हॉटस्पॉट/.test(normalized)) {
    if (allHotspots.length === 0) {
      return lang === 'mr'
        ? 'सध्या कोणताही कचरा हॉटस्पॉट आढळला नाही.'
        : 'No garbage hotspots are currently detected.'
    }
    if (site) {
      const siteHotspots = site.garbageHotspots
      if (siteHotspots.length === 0) {
        return lang === 'mr'
          ? `${site.mukamName} मध्ये सध्या कचरा हॉटस्पॉट आढळला नाही.`
          : `No garbage hotspots are currently detected at ${site.mukamName}.`
      }
      return lang === 'mr'
        ? `${site.mukamName} मध्ये कचरेचे हॉटस्पॉट आहेत: ${siteHotspots.join(', ')}.`
        : `Garbage hotspots at ${site.mukamName}: ${siteHotspots.join(', ')}.`
    }
    return lang === 'mr'
      ? `कचरेचे हॉटस्पॉट पुढील ठिकाणी आढळले आहेत: ${allHotspots.join(', ')}.`
      : `Garbage hotspots are currently detected in: ${allHotspots.join(', ')}.`
  }

  // Crowd / people present questions
  if (/people|pilgrim|crowd|density|संख्या|लोक/.test(normalized)) {
    if (site) {
      return lang === 'mr'
        ? `${site.mukamName} मध्ये सध्या एकूण ${site.totalPilgrims.toLocaleString('en-IN')} यात्री आणि सरासरी ${site.avgCrowdDensity}% भीड आहे.`
        : `${site.mukamName} currently has ${site.totalPilgrims.toLocaleString('en-IN')} pilgrims with an average crowd density of ${site.avgCrowdDensity}%.`
    }
    return lang === 'mr'
      ? `सध्या एकूण ${context.global.totalPilgrims.toLocaleString('en-IN')} यात्री पद्धतीमध्ये आहेत.`
      : `There are currently ${context.global.totalPilgrims.toLocaleString('en-IN')} pilgrims across all sites.`
  }

  // Site name / location
  if (/this location|current location|where am i|where is this|मला कुठे|name of this|location name/.test(normalized)) {
    if (site) {
      return lang === 'mr'
        ? `हे ${site.mukamName} आहे. स्थळ: ${site.location}.`
        : `This is ${site.mukamName}. Location: ${site.location}.`
    }
    const names = context.global.mukams.join(', ')
    return lang === 'mr'
      ? `या वेबसाइटवर पुढील मुकाम आहेत: ${names}.`
      : `The following sites are available on the website: ${names}.`
  }

  // Fallback
  if (lang === 'mr') {
    return 'माझ्या माहितीनुसार या वेबसाइटवर ही माहिती उपलब्ध नाही.'
  }
  return "Sorry, I couldn't find that information on the website."
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getChatAnswer(message: string): Promise<{ answer: string }> {
  if (!message || message.trim().length === 0) {
    return { answer: 'Please ask a question.' }
  }

  const context = buildContext(message)

  try {
    if (LLM_API_KEY) {
      const answer = await callLLM(context)
      return { answer }
    }
  } catch {
    // Fall through to local heuristic on any LLM failure
  }

  return { answer: localHeuristic(context) }
}
