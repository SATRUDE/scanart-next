"""Mark-approved geometric correction of complete generated framed objects.
No source artwork is pasted into a room. Nested planar regions retain existing
photograph/glazing/light, correcting the model's narrow proportions continuously.
"""
from pathlib import Path
import cv2, numpy as np, json, hashlib
root=Path('/Users/markdiffey/Desktop/ScanArt Image Tests')
items=[
 dict(slug='through-the-willows',file='Markus-through-the-willows-size-45x60-2026-09-28-test-04.png',paper=[45,60],outer=[[522,98],[814,78],[814,483],[523,477]],paperQuad=[[533,107],[802,90],[802,473],[533,468]],art=[[554,129],[781,117],[779,449],[554,447]],target=[[521,97],[815,82],[815,479],[521,476]]),
 dict(slug='pines-under-starlight',file='Markus-pines-under-starlight-size-45x60-2026-09-28-test-03.png',paper=[45,60],outer=[[507,139],[738,121],[737,450],[506,448]],paperQuad=[[515,147],[727,131],[727,442],[515,442]],art=[[525,157],[716,143],[716,430],[525,430]],target=[[498,133],[747,117],[747,451],[498,451]]),
 dict(slug='current-and-foam',file='Markus-current-and-foam-product-reference-size-test-02-rejected.png',paper=[45,60],outer=[[469,120],[731,99],[731,483],[468,477]],paperQuad=[[477,127],[723,109],[722,476],[477,469]],art=[[491,144],[705,128],[705,456],[491,450]],target=[[449,105],[748,85],[748,492],[449,486]]),
 dict(slug='morning-cabin-room',file='Markus-morning-cabin-room-product-reference-size-test-02-rejected.png',paper=[60,45],outer=[[190,70],[585,89],[584,387],[192,403]],paperQuad=[[204,82],[575,98],[574,379],[205,391]],art=[[223,99],[561,113],[560,364],[224,373]],target=[[180,70],[596,89],[596,387],[180,403]])
]
results=[]
for a in items:
 src=cv2.imread(str(root/a['file'])); h,w=src.shape[:2]; yy,xx=np.indices((h,w),dtype=np.float32); mx,my=xx.copy(),yy.copy()
 def quad(v): return np.array(v,np.float32)
 source=quad(a['outer']); target=quad(a['target']); pw,ph=a['paper']; ow,oh=pw+2.4,ph+2.4
 physical=quad([[0,0],[ow,0],[ow,oh],[0,oh]])
 H=cv2.getPerspectiveTransform(physical,target)
 def inset(x,y):
  return cv2.perspectiveTransform(quad([[x,y],[ow-x,y],[ow-x,oh-y],[x,oh-y]])[None],H)[0]
 target_paper=inset(1.2,1.2); bx,by=(1.5,2) if pw<ph else (2,1.5); target_art=inset(1.2+bx,1.2+by)
 def grow(q,px):
  c=q.mean(axis=0); v=q-c; return q+np.sign(v)*px
 src_shadow=grow(source,16); dst_shadow=grow(target,16)
 allq=np.concatenate([src_shadow,dst_shadow]); mn=np.floor(allq.min(axis=0)-25); ma=np.ceil(allq.max(axis=0)+25)
 fixed=quad([[mn[0],mn[1]],[ma[0],mn[1]],[ma[0],ma[1]],[mn[0],ma[1]]])
 def mapping(s,d):
  matrix=cv2.getPerspectiveTransform(d.astype(np.float32),s.astype(np.float32)); mask=np.zeros((h,w),np.uint8);cv2.fillConvexPoly(mask,np.rint(d).astype(np.int32),1)
  y,x=np.where(mask); pts=np.stack([x,y],axis=1).astype(np.float32)[None]; old=cv2.perspectiveTransform(pts,matrix)[0];mx[y,x]=old[:,0];my[y,x]=old[:,1]
 rings=[(fixed,fixed),(src_shadow,dst_shadow),(source,target),(quad(a['paperQuad']),target_paper),(quad(a['art']),target_art)]
 for (so,do),(si,di) in zip(rings,rings[1:]):
  for i in range(4):
   j=(i+1)%4;mapping(np.array([so[i],so[j],si[j],si[i]]),np.array([do[i],do[j],di[j],di[i]]))
 mapping(quad(a['art']),target_art)
 # Fade the local coordinate displacement to identity at the wall boundary.
 # Keep the flowers immediately below the Willows frame completely untouched.
 distance=np.minimum.reduce([xx-mn[0],ma[0]-xx,yy-mn[1],ma[1]-yy])
 weight=np.clip(distance/6,0,1)
 if a['slug']=='through-the-willows': weight*=np.clip((489-yy)/5,0,1)
 mx=xx+(mx-xx)*weight; my=yy+(my-yy)*weight
 result=cv2.remap(src,mx,my,cv2.INTER_LANCZOS4,borderMode=cv2.BORDER_REFLECT_101)
 dest=root/f"Markus-{a['slug']}-frame-geometry-final.png";cv2.imwrite(str(dest),result)
 outside=(xx<mn[0])|(xx>ma[0])|(yy<mn[1])|(yy>ma[1]); unchanged=bool(np.array_equal(src[outside],result[outside]))
 assert unchanged
 artmin=target_art.min(axis=0);artmax=target_art.max(axis=0)
 record=dict(a,selected=str(dest),source=str(root/a['file']),sourceSha256=hashlib.sha256((root/a['file']).read_bytes()).hexdigest(),targetPaperQuad=target_paper.tolist(),targetArtQuad=target_art.tolist(),artBox=[*artmin.tolist(),*artmax.tolist()],method='Continuous inverse image mapping of original generated frame, paper, photograph and glazing; shadow and small adjoining wall region follow; no replacement/source-art composite.',outsideEditRegionUnchanged=unchanged,editRegionConvention='Closed pixel-coordinate bounds; displacement fades to zero at boundary; Willows flowers below y489 untouched.',editRegion=[*mn.tolist(),*ma.tolist()],physicalOuterCm=[ow,oh],physicalArtworkCm=[pw-2*bx,ph-2*by])
 results.append(record);print(a['slug'], 'unchanged room outside region:',unchanged,'target art cm',record['physicalArtworkCm'])
(root/'Experiment files/markus-frame-geometry-2026-09-28/geometry-records.json').write_text(json.dumps(results,indent=2)+'\n')
Path('/tmp/markus-four-geometry-final.json').write_text(json.dumps(results,indent=2)+'\n')
