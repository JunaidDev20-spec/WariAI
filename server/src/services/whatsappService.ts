import { Client } from 'whatsapp-web.js'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { LocalAuth } = require('whatsapp-web.js')
import QRCode from 'qrcode'
import { exec } from 'child_process'
import { join } from 'path'
import clipboardy from 'clipboardy'

let client: Client | null = null
let ready = false

export function getWhatsAppReady(): boolean {
  return ready
}

export async function initWhatsApp(): Promise<void> {
  if (client) return

  client = new Client({
    authStrategy: new LocalAuth({ clientId: 'wariai' }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    },
  })

  client.on('qr', (qr: string) => {
    console.log('\n=== WHATSAPP QR CODE ===')
    const qrPath = join(process.cwd(), 'whatsapp-qr.png')
    QRCode.toFile(qrPath, qr, { width: 600, margin: 2 }, (err: Error | null | undefined) => {
      if (err) {
        console.error('Failed to write QR image:', err)
      } else {
        console.log(`QR saved to ${qrPath}`)
        exec(`start "" "${qrPath}"`, (openErr) => {
          if (openErr) console.error('Failed to open QR image:', openErr)
        })
      }
    })
    console.log('Scan it using WhatsApp → Linked Devices')
    console.log('========================\n')
  })

  client.on('ready', () => {
    ready = true
    console.log('WhatsApp client ready')
  })

  client.on('disconnected', (reason: string) => {
    ready = false
    console.log('WhatsApp client disconnected:', reason)
  })

  client.initialize()
}

export async function sendDeploymentWhatsApp(
  mukamId: string,
  zoneLabel: string,
  resources: Array<{
    id: string
    name: string
    type: string
    status: string
    baseLocation: string
  }>,
  groupName = 'Deploying Team'
): Promise<boolean> {
  try {
    const teams = resources.filter(r => r.type === 'team')
    const toilets = resources.filter(r => r.type === 'toilet')
    const dustbins = resources.filter(r => r.type === 'dustbin')

    const lines: string[] = []
    lines.push('🚨 WARI.AI SANITATION DEPLOYMENT')
    lines.push('')
    lines.push(`Mukam: ${mukamId}`)
    lines.push(`Zone: ${zoneLabel}`)
    lines.push(`Team: ${teams.map(t => t.name).join(', ') || 'N/A'}`)
    lines.push('')

    if (toilets.length > 0) {
      lines.push('TOILETS:')
      toilets.forEach(t => {
        lines.push(`${t.id} — ${t.baseLocation} — ${t.status.toUpperCase()}`)
      })
      lines.push('')
    }

    if (dustbins.length > 0) {
      lines.push('DUSTBINS:')
      dustbins.forEach(d => {
        lines.push(`${d.id} — ${d.baseLocation} — ${d.status.toUpperCase()}`)
      })
      lines.push('')
    }

    lines.push('Status: DEPLOYED')
    lines.push('Action: Immediate inspection/cleaning required')

    const message = lines.join('\n')

    await clipboardy.write(message)
    console.log('[WhatsApp] Deployment message copied to clipboard')

    exec('start chrome https://web.whatsapp.com/', (err) => {
      if (err) console.error('Failed to open Chrome:', err)
      else console.log('Opened WhatsApp Web in Chrome')
    })

    console.log('Deployment message copied to clipboard. Open Deploying Team and paste to send.')
    return true
  } catch (error) {
    console.error('[WhatsApp] Failed to prepare deployment notification:', error)
    return false
  }
}
