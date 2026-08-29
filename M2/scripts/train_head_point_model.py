"""Train a compact head-centre heatmap model from point-labelled drone frames.

This is intentionally a proof-of-concept trainer; hold out separate flights for
real evaluation rather than quoting its training loss as accuracy.
"""
import argparse, csv, json, random
from pathlib import Path
import cv2
import numpy as np
import torch
from torch import nn

class HeadUNet(nn.Module):
    def __init__(self):
        super().__init__()
        def block(a,b): return nn.Sequential(nn.Conv2d(a,b,3,padding=1),nn.ReLU(),nn.Conv2d(b,b,3,padding=1),nn.ReLU())
        self.a=block(3,24); self.b=block(24,48); self.c=block(48,96)
        self.pool=nn.MaxPool2d(2); self.up2=nn.ConvTranspose2d(96,48,2,2); self.d2=block(96,48); self.up1=nn.ConvTranspose2d(48,24,2,2); self.d1=block(48,24); self.out=nn.Conv2d(24,1,1)
    def forward(self,x):
        a=self.a(x); b=self.b(self.pool(a)); c=self.c(self.pool(b)); d=self.d2(torch.cat([self.up2(c),b],1)); return self.out(self.d1(torch.cat([self.up1(d),a],1)))

def target(points, x0, y0, size):
    y=np.zeros((size,size),np.float32); yy,xx=np.ogrid[-5:6,-5:6]; kernel=np.exp(-(xx*xx+yy*yy)/8).astype(np.float32)
    for x,y0p in points:
        x=int(x-x0); yp=int(y0p-y0)
        if 5 <= x < size-5 and 5 <= yp < size-5: y[yp-5:yp+6,x-5:x+6]=np.maximum(y[yp-5:yp+6,x-5:x+6],kernel)
    return y

def main():
    p=argparse.ArgumentParser();p.add_argument("--data",default="data/head_count/prepared");p.add_argument("--out",default="models/head_point_poc.pt");p.add_argument("--steps",type=int,default=300);p.add_argument("--size",type=int,default=256);a=p.parse_args()
    records=[]
    for im in sorted((Path(a.data)/"images").glob("*.png")):
        with (Path(a.data)/"points"/f"{im.stem}.csv").open() as f: points=[(int(r["x"]),int(r["y"])) for r in csv.DictReader(f)]
        records.append((cv2.cvtColor(cv2.imread(str(im)),cv2.COLOR_BGR2RGB),points,im.name))
    torch.manual_seed(42);random.seed(42);torch.set_num_threads(max(1, min(8, torch.get_num_threads())))
    model=HeadUNet(); opt=torch.optim.AdamW(model.parameters(),lr=1e-3,weight_decay=1e-5); loss_fn=nn.BCEWithLogitsLoss(); history=[]
    for step in range(1,a.steps+1):
        image,points,_=random.choice(records); h,w=image.shape[:2]
        # Most crops are centred around an annotated head; a minority are background.
        if random.random()<.85:
            px,py=random.choice(points); x0=max(0,min(w-a.size,px-random.randrange(a.size))); y0=max(0,min(h-a.size,py-random.randrange(a.size)))
        else: x0=random.randrange(max(1,w-a.size+1)); y0=random.randrange(max(1,h-a.size+1))
        crop=image[y0:y0+a.size,x0:x0+a.size]; crop=cv2.resize(crop,(a.size,a.size)) if crop.shape[:2]!=(a.size,a.size) else crop
        x=torch.from_numpy(crop).permute(2,0,1).float()[None]/255; y=torch.from_numpy(target(points,x0,y0,a.size))[None,None]
        logits=model(x); loss=loss_fn(logits,y); opt.zero_grad();loss.backward();opt.step()
        if step%25==0: history.append({"step":step,"loss":round(float(loss.detach()),6)});print(history[-1],flush=True)
    out=Path(a.out);out.parent.mkdir(parents=True,exist_ok=True);torch.save({"model_state_dict":model.state_dict(),"image_size":a.size,"training_images":[r[2] for r in records],"label_counts":{r[2]:len(r[1]) for r in records}},out)
    out.with_suffix(".history.json").write_text(json.dumps(history,indent=2));print(f"saved {out}")
if __name__=="__main__": main()
