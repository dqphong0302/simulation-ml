import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { compatibility, adaptGuide, dataContext, TABLE_NOTEBOOKS } from '../src/learning/dataContext';
import { GUIDES } from '../src/learning/guides';
import { makeUploadedNotebook } from '../src/lessons/python/uploaded';
import { orderLessons, LESSONS } from '../src/lessons';
import type { SessionData } from '../src/core/datasets/session';
const data: SessionData = { id:1,name:'my-study.csv',originalRows:60,sampled:false,table:{names:['patient_id','age','bmi','site','outcome'],delimiter:',',cells:Array.from({length:60},(_,i)=>[String(Math.floor(i/2)),String(18+i%40),String(20+i%13),i%3?'A':'B',Math.floor(i/2)%2?'yes':'no'])} };
const sources = () => [...TABLE_NOTEBOOKS].map(id => ({id,code:makeUploadedNotebook(id,data).cells.filter(c=>c.cell_type==='code').map(c=>c.source.join('')).filter(s=>!s.startsWith('%pip')).join('\n\n')}));
describe('data-adaptive learning', () => {
  it('orders ML explicitly without mutating the catalogue', () => {
    expect(orderLessons(LESSONS.filter(l=>l.group==='ml')).map(l=>l.id)).toEqual(['KNN','TREE','LOGREG','COMPARE','TEACHABLE','LINREG','KMEANS','PCA','FOREST','BOOST','SVM']);
    expect(LESSONS[3].id).toBe('KMEANS');
  });
  it('uses actual columns and flags limitations without assuming clinical meaning', () => {
    expect(dataContext(data).flags).toContain('patient_id');
    expect(compatibility('KNN','/ml/knn',data).suitable).toBe(true);
    expect(compatibility('CNN','/dl/cnn',data).suitable).toBe(false);
    const unlabelled = {...data, table:{names:['length','width'],delimiter:',',cells:Array.from({length:40},(_,i)=>[String(i),String(i*2)])}};
    expect(compatibility('KNN','/ml/knn',unlabelled).suitable).toBe(false);
    expect(compatibility('PCA','/ml/pca',unlabelled).suitable).toBe(true);
    const guide = adaptGuide('EDA',GUIDES.EDA,data);
    expect(guide.case).toContain('my-study.csv');
    expect(guide.case).toContain('age');
    expect(guide.case).toContain('Không suy ra đây là dữ liệu y khoa');
    expect(guide.experiment[1]).toContain('không chuyển sang Pima');
    expect(compatibility('TREE','/ml/tree',{...data,table:{...data.table,cells:Array.from({length:1001},(_,i)=>data.table.cells[i%60])}}).reason).toContain('1000');
  });
  it('generates syntactically valid notebooks without row payloads', () => {
    const result=spawnSync('python3',['-c','import ast,json,sys\nfor x in json.load(sys.stdin): ast.parse(x["code"],filename=x["id"])'],{input:JSON.stringify(sources()),encoding:'utf8'});
    expect(result.status,result.stderr).toBe(0);
    expect(JSON.stringify(makeUploadedNotebook('KNN',data))).not.toContain('my-study.csv');
    expect(()=>makeUploadedNotebook('CNN',data)).toThrow();
  });
  if(process.env.NOTEBOOK_PYTHON) it('executes all uploaded-table notebooks offline, including group split and mixed columns',()=>{
    const csv=[data.table.names.join(','),...data.table.cells.map(r=>r.join(','))].join('\n');
    const prelude=`import sys,types\ngoogle=types.ModuleType("google")\ncolab=types.ModuleType("google.colab")\ncolab.files=types.SimpleNamespace(upload=lambda:{"data.csv":${JSON.stringify(csv)}.encode()})\nsys.modules["google"]=google\nsys.modules["google.colab"]=colab\n`;
    for(const {id,code} of sources()) {
      const program=prelude+code.replace('CONFIG_CONFIRMED = False','CONFIG_CONFIRMED = True').replace('POSITIVE = None','POSITIVE = "yes"').replace('GROUP_COLUMN = None','GROUP_COLUMN = "patient_id"');
      const result=spawnSync(process.env.NOTEBOOK_PYTHON!,['-c',program],{encoding:'utf8',timeout:30000,env:{...process.env,MPLBACKEND:'Agg'}});
      expect(result.status,`${id}: ${result.stderr}`).toBe(0);
    }
  },180000);
});
