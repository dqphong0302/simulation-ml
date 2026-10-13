import type { Group } from '../lessons';
import type { ReactNode } from 'react';

function Diagram({ id }: { id: string }): ReactNode {
  const line = (x1:number,y1:number,x2:number,y2:number) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#77b8d1" strokeWidth="2" />;
  const dot = (x:number,y:number,r=7) => <circle className="visual-point" cx={x} cy={y} r={r} fill="#009fc7" />;
  const box = (x:number,y:number,w=42,h=30) => <rect x={x} y={y} width={w} height={h} rx="6" fill="#d2edf8" stroke="#3b96bb" />;
  const tree = (x:number,y:number,s=1) => <g transform={`translate(${x} ${y}) scale(${s})`}>{line(0,0,-40,32)}{line(0,0,40,32)}{line(-40,32,-60,62)}{line(-40,32,-20,62)}{line(40,32,20,62)}{line(40,32,60,62)}{[[0,0],[-40,32],[40,32],[-60,62],[-20,62],[20,62],[60,62]].map(([a,b],i)=><g key={i}>{dot(a,b,6)}</g>)}</g>;
  switch(id) {
    case 'TEACHABLE': return <>{box(24,33,83,65)}<circle cx="66" cy="65" r="20" fill="none" stroke="#009fc7" strokeWidth="4"/><circle cx="66" cy="65" r="8" fill="#009fc7"/>{line(114,65,173,65)}{[0,1,2].map(i=><g key={i}>{box(189,15+i*36,84,26)}<rect x="196" y={23+i*36} width={[57,28,10][i]} height="10" rx="3" fill="#009fc7"/></g>)}</>;
    case 'TREE': return tree(150,22,1.3);
    case 'FOREST': return <>{[65,150,235].map(x=><g key={x}>{tree(x,30,.6)}</g>)}{line(65,90,150,113)}{line(235,90,150,113)}{dot(150,113)}</>;
    case 'KNN': return <>{[[-30,-20],[20,-30],[36,12],[-24,32]].map(([x,y],i)=><g key={i}>{line(150,65,150+x,65+y)}{dot(150+x,65+y)}</g>)}<circle cx="150" cy="65" r="48" stroke="#009fc7" strokeDasharray="4 4" fill="none"/><circle cx="150" cy="65" r="9" fill="#ed9675"/>{dot(40,24)}{dot(258,103)}</>;
    case 'LOGREG': return <>{line(30,105,270,105)}{line(30,15,30,105)}<path d="M40 97 C140 97 115 25 260 25" stroke="#009fc7" strokeWidth="4" fill="none"/><path d="M30 60H270" stroke="#ed9675" strokeDasharray="5 5"/></>;
    case 'LINREG': return <>{line(30,110,270,110)}<path d="M40 100L260 22" stroke="#009fc7" strokeWidth="3"/>{[0,1,2,3,4,5].map(i=><g key={i}>{dot(50+i*38,96-i*13+(i%2?12:-9),5)}</g>)}</>;
    case 'SVM': return <><path d="M105 115L185 10M75 115L155 10M135 115L215 10" stroke="#009fc7" strokeWidth="2" strokeDasharray="5 4"/>{[0,1,2,3,4].map(i=><g key={i}>{dot(40+i*14,25+i*16,5)}<circle cx={210+i*13} cy={30+i*16} r="5" fill="#e89373"/></g>)}</>;
    case 'KMEANS': return <>{[[65,45],[155,88],[240,38]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="28" fill={['#d8eff9','#e2eaf9','#fde8df'][i]}/>{[0,1,2,3].map(j=><g key={j}>{dot(x-12+j*8,y+(j%2?10:-8),4)}</g>)}<path d={`M${x-6} ${y}h12M${x} ${y-6}v12`} stroke="#1e5471" strokeWidth="2"/></g>)}</>;
    case 'PCA': return <><ellipse cx="150" cy="65" rx="94" ry="26" transform="rotate(-25 150 65)" fill="#d4eefa"/>{line(50,110,250,18)}{line(130,20,175,115)}{[0,1,2,3,4,5].map(i=><g key={i}>{dot(75+i*30,96-i*12,4)}</g>)}</>;
    case 'EDA': return <><rect x="34" y="18" width="110" height="94" rx="8" fill="#fff" stroke="#3b96bb"/>{[0,1,2,3,4,5].map(i=><rect key={i} x={44+i*16} y={100-[20,44,70,52,30,14][i]} width="12" height={[20,44,70,52,30,14][i]} rx="2" fill="#009fc7"/>)}<line x1="182" x2="270" y1="66" y2="66" stroke="#77b8d1" strokeWidth="2"/><rect x="200" y="50" width="44" height="32" fill="#d2edf8" stroke="#3b96bb" strokeWidth="2"/><line x1="218" x2="218" y1="50" y2="82" stroke="#1e5471" strokeWidth="3"/><circle cx="280" cy="66" r="4" fill="#ed9675"/></>;
    case 'DATA': return <>{[30,80,130,180,230].map((x,i)=><g key={x}>{box(x,105-[35,65,90,52,25][i],30,[35,65,90,52,25][i])}</g>)}</>;
    case 'COMPARE': return <>{[35,95,155,215].map((x,i)=><g key={x}>{box(x,95-i*16,18,20+i*16)}<rect x={x+21} y={80-i*9} width="18" height={35+i*9} rx="3" fill="#73bed9"/></g>)}</>;
    case 'CNN': return <>{Array.from({length:25},(_,i)=><rect key={i} x={30+i%5*17} y={20+Math.floor(i/5)*17} width="15" height="15" fill={i%3?'#d4eaf5':'#148db7'}/>)}<rect x="45" y="35" width="53" height="53" fill="none" stroke="#e89172" strokeWidth="3"/>{line(130,65,185,65)}{[0,1,2,3,4,5,6,7,8].map(i=><rect key={i} x={205+i%3*20} y={34+Math.floor(i/3)*20} width="18" height="18" fill={i%2?'#3b9fc2':'#badfeb'}/>)}</>;
    case 'ATTN': return <>{Array.from({length:36},(_,i)=><rect key={i} x={88+i%6*20} y={5+Math.floor(i/6)*20} width="18" height="18" fill="#008cb8" opacity={.12+(i*7%11)/12}/>)}</>;
    case 'GPT': return <>{[32,110,188].map((x,i)=><g key={x}>{box(x,37,65,54)}<text x={x+32} y="69" textAnchor="middle" fill="#185c80" fontSize="12">{['Token','Attention','Token'][i]}</text></g>)}{line(97,64,110,64)}{line(175,64,188,64)}</>;
    case 'AE': case 'VAE': return <>{[55,150,245].map((x,i)=><g key={x}>{(i===1?[65]:[30,65,100]).map(y=><g key={y}>{line(55,y,150,65)}{line(150,65,245,y)}{dot(x,y)}</g>)}</g>)}{id==='VAE'&&<ellipse cx="150" cy="65" rx="25" ry="38" stroke="#e69578" fill="none" strokeDasharray="3 4"/>}</>;
    case 'GAN': return <>{box(40,40,75,50)}{box(185,40,75,50)}<text x="77" y="71" textAnchor="middle" fill="#175775">Sinh</text><text x="222" y="71" textAnchor="middle" fill="#175775">Phân biệt</text><path d="M115 48Q150 12 185 48M185 82Q150 118 115 82" stroke="#008cb8" fill="none" strokeWidth="2"/></>;
    case 'DIFF': return <>{Array.from({length:60},(_,i)=><circle key={i} cx={25+(i*37)%115} cy={15+(i*23)%100} r={2+i%3} fill="#689fba" opacity=".55"/>)}{line(150,65,188,65)}<circle cx="230" cy="65" r="33" fill="#00a6c8"/><circle cx="219" cy="55" r="9" fill="#a8e7f7"/></>;
    case 'RAG': return <>{[0,1,2].map(i=><g key={i}>{box(25+i*12,22+i*9,45,63)}</g>)}{line(98,65,135,65)}<circle cx="160" cy="60" r="22" fill="none" stroke="#009fc7" strokeWidth="4"/>{line(175,77,193,94)}{box(214,38,60,46)}</>;
    case 'GENAI': return <>{box(32,23,165,38)}{box(95,76,170,35)}<path d="M50 39h100M112 91h120" stroke="#009fc7" strokeWidth="3"/><path d="M203 24l7 12 14 3-14 5-7 14-5-14-14-5 14-3z" fill="#00a6c8"/></>;
    case 'GENCON': return <>{['Học','AI','cùng','nhau'].map((t,i)=><g key={t}>{box(22+i*70,45,60,36)}<text x={52+i*70} y="68" fontSize="13" textAnchor="middle" fill="#176384">{t}</text></g>)}</>;
    default: return <>{[50,115,180,245].flatMap((x,i)=>[25,65,105].map(y=><g key={`${x}${y}`}>{i<3&&[25,65,105].map(z=><g key={z}>{line(x,y,x+65,z)}</g>)}{dot(x,y)}</g>))}</>;
  }
}

/** Decorative conceptual preview, not an output of a trained model. */
export function LessonVisual({ group, label, lessonId }: { group: Group; label: string; lessonId?: string }) {
  return <div className={`lesson-visual visual-${group}`} aria-hidden="true">
    <span className="visual-grid" />
    <svg viewBox="0 0 300 130" focusable="false">
      {lessonId ? <Diagram id={lessonId} /> : group === 'ml' || group === 'foundation' ? <>
        <path className="visual-boundary" d="M35 105 C95 105 110 22 265 24" />
        {Array.from({ length: 18 }, (_, i) => <circle key={i} className="visual-point" cx={35 + (i * 43) % 225} cy={20 + (i * 29) % 90} r={4 + i % 3} fill={i % 2 ? '#ef997e' : '#16887c'} style={{ animationDelay: `${i * .08}s` }} />)}
      </> : group === 'dl' ? <>
        {[0, 1, 2].flatMap(l => [0, 1, 2].flatMap(i => [0, 1, 2].map(j => <path key={`${l}${i}${j}`} className="visual-connection" d={`M${45 + l * 70} ${30 + i * 35} L${115 + l * 70} ${30 + j * 35}`} />)))}
        {[0, 1, 2, 3].flatMap(l => [0, 1, 2].map(i => <circle key={`${l}${i}`} className="visual-point" cx={45 + l * 70} cy={30 + i * 35} r="8" fill={l % 2 ? '#b898dc' : '#16887c'} style={{ animationDelay: `${l * .2 + i * .1}s` }} />))}
      </> : <>
        {[0, 1, 2, 3, 4].map(i => <g key={i} className="visual-token" style={{ animationDelay: `${i * .2}s` }}><rect x={27 + i * 52} y={42 + (i % 2) * 12} width="43" height="33" rx="9" fill={i === 4 ? '#16887c' : '#d5e9df'} /><path d={`M${37 + i * 52} ${58 + (i % 2) * 12}h22`} stroke={i === 4 ? 'white' : '#69968a'} strokeWidth="3" strokeLinecap="round" /></g>)}
        <path d="M45 98 Q150 122 255 98" fill="none" stroke="#e6a288" strokeWidth="2" strokeDasharray="4 5" />
      </>}
    </svg>
    <span className="visual-label">{label}</span><span className="visual-play">↗</span>
  </div>;
}
