from pathlib import Path
from PIL import Image, ImageDraw
import json, math, colorsys, shutil

ROOT=Path(__file__).parent
portable=(ROOT/'layout-geometry.json').exists()
OUT=ROOT/'generated' if portable else ROOT/'github-upload'/'docs'/'gif-examples'
OUT.mkdir(exist_ok=True)
(OUT/'gifs').mkdir(exist_ok=True)
(OUT/'projects').mkdir(exist_ok=True)
layout=json.loads((ROOT/('layout-geometry.json' if portable else 'gif-layout.json')).read_text(encoding='utf8'))
rows=layout['rows']; boxes=layout['boxes']; lookup={b['index']:b for b in boxes}
R=(255,0,0); G=(0,255,0); B=(0,80,255); C=(0,255,255); Y=(255,255,0); M=(255,0,255); W=(255,255,255); O=(255,96,0); BLACK=(0,0,0)
N=32
def scale(color,level): return tuple(round(v*max(0,min(1,level))) for v in color)
def hsv(h,s=1,v=1): return tuple(round(c*255) for c in colorsys.hsv_to_rgb(h%1,s,v))
def empty(): return {b['index']:BLACK for b in boxes}
def grid_point(k):
 b=lookup[k['index']];return (b['x']+b['width']/2)/320*13, (b['y']+b['height']/2)/96*6-.5
def glyph(pat,t,color=C,secondary=Y,center=.5,y0=0,level=1):
 result=empty();width=len(pat[0]);palette={'1':scale(color,level),'2':scale(secondary,level),'3':scale(W,level)}
 for y,line in enumerate(pat):
  if not 0<=y+y0<5:continue
  row=rows[y+y0];mid=min(range(len(row)),key=lambda j:abs((lookup[row[j]['index']]['x']+lookup[row[j]['index']]['width']/2)/320-center));start=mid-width//2
  for x,value in enumerate(line):
   if value in palette and 0<=start+x<len(row):result[row[start+x]['index']]=palette[value]
 return result
def combine(*maps):
 result=empty()
 for m in maps:
  for k,v in m.items():result[k]=tuple(max(a,b) for a,b in zip(result[k],v))
 return result
def dots(points,color):
 result=empty()
 for r,x in points:
  if 0<=r<5:
   key=min(rows[r],key=lambda k:abs(grid_point(k)[0]-x));result[key['index']]=color
 return result
HEART=['01010','11111','11111','01110','00100']
SMILE=['11111','10101','11111','10001','01110']
GHOST=['01110','11111','10201','11111','10101']
STAR=['00100','11111','01110','01010','10001']
FLOWER=['00100','01210','12321','01210','00100']
DIGITS={'3':['111','001','111','001','111'],'2':['111','001','111','100','111'],'1':['010','110','010','010','111'],'0':['111','101','101','101','111']}
items=[]
def add(slug,ru,en,category,func,n=N):
 items.append({'id':f'{len(items)+1:02d}-{slug}','ru':ru,'en':en,'category':category,'func':func,'n':n})
def icon(pat,color=C,secondary=Y,style='pulse'):
 def paint(t):
  level=.35+.65*(.5+.5*math.cos(t*2*math.pi)) if style=='pulse' else 1
  return glyph(pat,t,color,secondary,level=level)
 return paint

add('red-heart','Красное сердце','Red heart','icons',lambda t:glyph(HEART,t,R,level=.3+.7*max(math.exp(-((t-.15)/.09)**2),.7*math.exp(-((t-.4)/.11)**2))))
add('broken-heart','Разбитое сердце','Broken heart','icons',icon(['01010','11011','11101','01010','00000'],R))
add('two-hearts','Два сердца','Two hearts','icons',lambda t:combine(glyph(HEART,t,M,center=.27,level=.4+.6*(.5+.5*math.sin(t*math.tau))),glyph(HEART,t,R,center=.74,level=.4+.6*(.5+.5*math.cos(t*math.tau)))))
add('smile','Улыбка','Smile','icons',icon(SMILE,Y))
add('wink','Подмигивание','Wink','icons',lambda t:glyph(SMILE if t<.72 else ['11111','10111','11111','10001','01110'],t,Y))
add('eyes','Моргающие глаза','Blinking eyes','icons',lambda t:glyph(['0000000','1110111','1210121','1110111','0000000'] if t<.82 else ['0000000','0000000','1110111','0000000','0000000'],t,W,B))
add('ghost','Привидение','Ghost','icons',lambda t:glyph(GHOST if t<.5 else ['01110','11111','10201','11111','01010'],t,C,B))
add('alien','Инопланетянин','Alien','icons',icon(['01110','10101','11111','01110','10101'],G))
add('space-invader','Космический захватчик','Space invader','icons',lambda t:glyph(['0010100','0111110','1101011','1111111','1010101' if t<.5 else '0101010'],t,G))
add('skull','Череп','Skull','icons',icon(['01110','11111','10101','01110','01010'],W))
add('lightning','Молния','Lightning','icons',icon(['00110','01100','11111','00110','01100'],Y))
add('star','Звезда','Star','icons',icon(STAR,Y))
add('diamond','Бриллиант','Diamond','icons',icon(['00100','01110','11111','01110','00100'],C))
add('plus','Зелёный плюс','Green plus','icons',icon(['00100','00100','11111','00100','00100'],G))
add('check','Галочка','Check mark','icons',icon(['00001','00010','10100','01000','00000'],G))
add('exclamation','Восклицательный знак','Exclamation mark','icons',icon(['010','010','010','000','010'],O))
add('question','Вопросительный знак','Question mark','icons',icon(['01110','10001','00110','00000','00100'],C))
def battery(t):
 p=['1111110','1000011','1000011','1000011','1111110'];result=glyph(p,t,W)
 for row in range(1,4):
  line=list(p[row])
  for x in range(1,1+min(4,int(t*5)+1)):line[x]='2'
  p[row]=''.join(line)
 return glyph(p,t,W,G)
add('battery','Заряд батареи','Battery charge','icons',battery)
add('thermometer','Термометр','Thermometer','icons',icon(['010','010','010','111','111'],R))
add('music-note','Музыкальная нота','Music note','icons',icon(['00111','00101','00101','11101','11011'],M))

def flower(t,center=.5,color=M):
 radius=min(3,(t%1)*7);p=[]
 for y,line in enumerate(FLOWER):p.append(''.join(v if abs(x-2)+abs(y-2)<=radius else '0' for x,v in enumerate(line)))
 return glyph(p,t,color,Y,center=center,level=1 if t<.8 else (1-t)/.2)
add('bloom','Распускающийся цветок','Blooming flower','nature',flower)
add('flowers-in-turn','Цветы по очереди','Flowers in turn','nature',lambda t:flower((t*3)%1,[.23,.5,.77][min(2,int(t*3))],[M,C,R][min(2,int(t*3))]))
def sunrise(t):
 result=empty();cy=6-t*5
 for row in range(5):
  for k in rows[row]:
   x,y=grid_point(k);d=math.hypot((x-6.5)/1.3,y-cy)
   if d<1.8:result[k['index']]=O if d>1 else Y
 return result
add('sunrise','Восход солнца','Sunrise','nature',sunrise)
add('sun','Солнечные лучи','Sun rays','nature',lambda t:glyph(['10101','01110','11211','01110','10101'] if t<.5 else ['00100','01110','11211','01110','00100'],t,O,Y))
add('moon','Полумесяц','Crescent moon','nature',icon(['01110','11000','11000','11000','01110'],C))
def rain(t,snow=False):
 result=empty()
 for row in range(5):
  for k in rows[row]:
   x,y=grid_point(k);head=((t*7+(round(x)*3)%7)%7)-1;tail=head-y
   if 0<=tail<2 and round(x)%3==0:result[k['index']]=scale(W if snow else C,1-tail/2)
 return result
add('rain','Капли дождя','Raindrops','nature',rain)
add('snow','Снежинка','Snowflake','nature',lambda t:glyph(['10101','01110','11211','01110','10101'],t,W,C,level=.45+.55*(.5+.5*math.cos(t*math.tau))))
add('flame','Языки пламени','Flame','nature',lambda t:glyph((['00100','01100','01110','11211','12221'] if t<.33 else ['00010','00110','01110','11211','12221'] if t<.66 else ['00100','00110','01110','11211','12221']),t,R,Y))
def campfire(t):
 result=glyph(['00100','01100','01110','11211','00000'] if t<.5 else ['00010','00110','01110','11211','00000'],t,O,Y)
 return combine(result,glyph(['00000','00000','00000','00000','11111'],t,(160,50,0)))
add('campfire','Костёр','Campfire','nature',campfire)
def water(t):
 result=empty()
 for r,row in enumerate(rows[:5]):
  for k in row:
   x,y=grid_point(k);top=2+math.sin(x*.8-t*math.tau)*.7
   if y>=top:result[k['index']]=C if y<top+.9 else B
 return result
add('water','Морская волна','Water wave','nature',water)

def dot_eater(t):
 p=['01110','11111','11100' if t<.5 else '11111','11111','01110'];center=.2+.6*t
 result=glyph(p,t,Y,center=center)
 for x in [4,6,8,10,12]:
  if x/13>center+.12:result=combine(result,dots([(2,x)],W))
 return result
add('dot-eater','Поедатель точек','Dot eater','retro',dot_eater)
add('ghost-chase','Погоня привидений','Ghost chase','retro',lambda t:combine(glyph(GHOST,t,C,B,center=.60+.14*t),glyph(GHOST,t,M,B,center=.20+.14*t)))
snake_path=[k['index'] for r,row in enumerate(rows[:5]) for k in (row if r%2==0 else list(reversed(row)))]
def snake(t):
 result=empty();head=12+int(t*(len(snake_path)-13))
 for back in range(12):result[snake_path[(head-back)%len(snake_path)]]=scale(G,1-back/14)
 result[snake_path[head%len(snake_path)]]=Y;return result
add('snake','Змейка','Snake','retro',snake)
def pong(t):
 result=empty();ballx=1+11*(1-abs(t*2-1));bally=1+2*(.5+.5*math.sin(t*math.tau))
 for r,row in enumerate(rows[:5]):
  result[row[0]['index']]=W if abs(r-(1+int(t*2)))<1.3 else BLACK
  result[row[-1]['index']]=W if abs(r-(3-int(t*2)))<1.3 else BLACK
 return combine(result,dots([(round(bally),ballx)],Y))
add('pong','Понг','Pong','retro',pong)
def tetris(t):
 result=empty();parts=[(['111','010'],M),(['11','11'],Y),(['110','011'],G),(['111','001'],O)]
 pat,color=parts[min(3,int(t*4))];y0=int((t*4%1)*4)
 return glyph(pat,t,color,y0=y0)
add('falling-blocks','Падающие блоки','Falling blocks','retro',tetris)
def hourglass(t):
 result=glyph(['11111','01010','00100','01010','11111'],t,W)
 return combine(result,dots([(1,6.5)] if t<.35 else [(2,6.5)] if t<.7 else [(3,6),(3,7)],Y))
add('hourglass','Песочные часы','Hourglass','retro',hourglass)
def loader(t):
 coords=[(0,6.5),(1,8),(2,8.5),(3,8),(4,6.5),(3,5),(2,4.5),(1,5)]
 result=empty();head=int(t*8)
 for back in range(5):result=combine(result,dots([coords[(head-back)%8]],scale(C,1-back/6)))
 return result
add('loader','Круг загрузки','Loading ring','retro',loader)
def progress(t):
 result=empty()
 for row in rows[1:4]:
  for k in row:
   x,_=grid_point(k);result[k['index']]=G if x/13<t else (8,25,8)
 return result
add('progress','Полоса загрузки','Progress bar','retro',progress)
ARROW=['00100','00010','11111','00010','00100']
add('arrow-right','Стрелка вправо','Right arrow','retro',lambda t:glyph(ARROW,t,C,center=.25+.5*t))
add('arrow-left','Стрелка влево','Left arrow','retro',lambda t:glyph([r[::-1] for r in ARROW],t,O,center=.75-.5*t))

def field(func,all_rows=True):
 def paint(t):
  result=empty()
  for k in [k for row in (rows if all_rows else rows[:5]) for k in row]:
   x,y=grid_point(k);result[k['index']]=func(x,y,t)
  return result
 return paint
def fireworks(t):
 result=empty();phase=t*3;step=int(phase);r=(phase%1)*4;cx=[3,9.5,6.5][step];cy=[2,1.5,2][step]
 for row in rows[:5]:
  for k in row:
   x,y=grid_point(k);d=math.hypot(x-cx,(y-cy)*1.3)
   if abs(d-r)<.65:result[k['index']]=scale([M,C,Y][step],1-(phase%1)*.25)
 return result
add('fireworks','Фейерверк','Fireworks','motion',fireworks)
def meteor(t):
 x=1+t*11;y=-1+t*6;result=empty()
 for row in rows[:5]:
  for k in row:
   kx,ky=grid_point(k);dx=x-kx;dy=y-ky
   if abs(dx-dy*1.8)<1.2 and 0<=dx<5:result[k['index']]=W if dx<1 else Y if dx<2 else O if dx<3 else scale(R,(5-dx)/2)
 return result
add('meteor','Падающий метеор','Falling meteor','motion',meteor)
def comet(t):
 result=empty();x=-2+t*20;head=hsv(.57*(1-min(1,t*1.5)),.8,1)
 for row in rows[:5]:
  for k in row:
   kx,ky=grid_point(k);dx=x-kx
   if abs(ky-2)<.8 and 0<=dx<6:result[k['index']]=W if dx<.8 else scale(head,(1-dx/6)**1.3)
 return result
add('comet','Комета с хвостом','Comet with tail','motion',comet)
def ball(t):
 cx=1+11*(1-abs(t*2-1));cy=3-2.5*abs(math.sin(t*math.tau))
 return field(lambda x,y,t:R if (x-cx)**2+(y-cy)**2<1.4 else BLACK,False)(t)
add('bouncing-ball','Прыгающий мяч','Bouncing ball','motion',ball)
add('vertical-laser','Вертикальный сканер','Vertical scanner','motion',field(lambda x,y,t:scale(C,max(0,1-abs(x-13*t)/1.2))))
add('horizontal-laser','Горизонтальный сканер','Horizontal scanner','motion',field(lambda x,y,t:scale(M,max(0,1-abs(y-5*t)/.9))))
add('rainbow-wave','Радужная волна','Rainbow wave','effects',field(lambda x,y,t:hsv(x/13-t)))
add('diagonal-rainbow','Радужные диагонали','Diagonal rainbow','effects',field(lambda x,y,t:hsv((x+y*1.4)/12-t)))
add('checkerboard','Шахматная доска','Checkerboard','effects',lambda t:{k['index']:(C if (c+r+int(t*2))%2 else M) for r,row in enumerate(rows) for c,k in enumerate(row)})
def matrix(t):
 result=empty()
 for r,row in enumerate(rows):
  for k in row:
   x,y=grid_point(k);age=((t*7+(round(x)*11)%9)-y)%7
   result[k['index']]=W if age<.45 else scale(G,max(0,1-age/3.5))
 return result
add('matrix','Зелёный цифровой дождь','Green digital rain','effects',matrix)
add('aurora','Северное сияние','Northern lights','effects',field(lambda x,y,t:hsv(.35+.25*(.5+.5*math.sin(x*.5+y*.7-t*math.tau)),1,.25+.75*(.5+.5*math.sin(x*.6+y-t*math.tau)))))
add('lava','Лава','Lava','effects',field(lambda x,y,t:(255,round(100*(.5+.5*math.sin(x*.8+y-t*math.tau))),0)))
add('ocean','Глубокий океан','Deep ocean','effects',field(lambda x,y,t:(0,round(210*(.5+.5*math.sin(x*.6+y-t*math.tau))),255)))
add('candy','Сахарный неон','Candy neon','effects',field(lambda x,y,t:M if (int(x+y+t*10)%5)<3 else W))
def ecg(t):
 result=empty();wave=[2,2,2,1,3,0,4,2,2,2,2,2,2,2];head=int(t*14)
 for x in range(14):
  if (head-x)%14<8:result=combine(result,dots([(wave[x],x)],scale(G,1-((head-x)%14)/10)))
 return result
add('ecg','Кардиограмма','ECG trace','motion',ecg)
add('equalizer','Эквалайзер','Equalizer','effects',field(lambda x,y,t:hsv((4-y)/8) if y<=4 and y>4-(1+4*(.5+.5*math.sin(round(x)*1.2+t*math.tau))) else BLACK,False))
add('countdown','Обратный отсчёт 3–2–1','Countdown 3–2–1','retro',lambda t:glyph(DIGITS[['3','2','1','0'][min(3,int(t*4))]],t,[Y,O,R,G][min(3,int(t*4))]))
add('orbit','Цветная орбита','Colour orbit','motion',lambda t:combine(loader(t),glyph(['00000','00000','00100','00000','00000'],t,Y)))
add('pinwheel','Вертушка','Pinwheel','motion',lambda t:glyph(['11000','01101','00100','10110','00011'] if int(t*4)%2==0 else ['00011','10110','00100','01101','11000'],t,C,Y))
add('twinkle','Звёздное мерцание','Star twinkle','effects',field(lambda x,y,t:scale(Y if round(x+y)%2 else C,(max(0,math.sin(t*math.tau+x*3+y*7)))**9)))

assert len(items)==60,len(items)
catalog=[]
for item in items:
 frames=[];expected=[]
 for f in range(item['n']):
  colors=item['func'](f/item['n']);image=Image.new('RGB',(320,96),BLACK);draw=ImageDraw.Draw(image)
  for box in boxes:
   color=colors[box['index']];draw.rectangle((math.floor(box['x']),math.floor(box['y']),math.ceil(box['x']+box['width'])-1,math.ceil(box['y']+box['height'])-1),fill=color)
  frames.append(image)
  values=[0]*396
  for index,rgb in colors.items():values[index*3:index*3+3]=rgb
  expected.append(values)
 file=OUT/'gifs'/(item['id']+'.gif')
 frames[0].save(file,save_all=True,append_images=frames[1:],duration=[120 if f%2==0 else 130 for f in range(item['n'])],loop=0,disposal=2,optimize=False)
 decoded=Image.open(file);assert decoded.n_frames>1,(item['id'],decoded.n_frames)
 entry={k:item[k] for k in ['id','ru','en','category']}
 entry.update(gif='gifs/'+file.name,project='projects/'+item['id']+'.json',fps=8,fit='contain',sampling='average',frames=decoded.n_frames,durationMs=sum((decoded.seek(i),decoded.info.get('duration',100))[1] for i in range(decoded.n_frames)),bytes=file.stat().st_size)
 catalog.append(entry)
 expected_folder=OUT/'qa-expected' if portable else ROOT/'gif-expected'
 expected_folder.mkdir(exist_ok=True)
 (expected_folder/(item['id']+'.json')).write_text(json.dumps(expected),encoding='utf8')
(OUT/'manifest.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf8')
print(f'Created {len(catalog)} real animated GIF files; {sum(i["bytes"] for i in catalog):,} bytes')
