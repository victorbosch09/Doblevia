const DV = {
  careers:{
    a:{id:'a',name:'Derecho y Ciencias Políticas',short:'Derecho',year:'1er año',emoji:'⚖️',subjects:[
      {id:'cp',name:'Principios de Ciencias Políticas',emoji:'🏛️',topics:[]},
      {id:'dr',name:'Derecho Romano',emoji:'⚖️',topics:[]},
      {id:'sj',name:'Sociología Jurídica',emoji:'📚',topics:[]},
      {id:'fd',name:'Filosofía del Derecho',emoji:'🧠',topics:[]},
      {id:'te',name:'Taller de Escritura Jurídica',emoji:'✍️',topics:[]},
      {id:'id',name:'Introducción al Derecho',emoji:'📖',topics:[]},
      {id:'da',name:'Debate y Argumentación Jurídica',emoji:'🗣️',topics:[]}
    ]},
    b:{id:'b',name:'Marketing Digital y Gerencia de Marca',short:'Marketing',year:'2do año',emoji:'📈',subjects:[
      {id:'mk',name:'Fundamentos de Marketing Digital',emoji:'📱',topics:[]},
      {id:'gb',name:'Gerencia de Marca',emoji:'🎯',topics:[]},
      {id:'cm',name:'Comportamiento del Consumidor',emoji:'🧠',topics:[]},
      {id:'pm',name:'Publicidad y Medios Digitales',emoji:'📺',topics:[]},
      {id:'am',name:'Analítica de Marketing',emoji:'📊',topics:[]}
    ]}
  },
  T:{}, Q:{},
  topic(c, sid, t){
    const s = this.careers[c].subjects.find(x=>x.id===sid);
    t.career=c; t.sid=sid; t.idx=s.topics.length;
    t.quiz = t.quiz.map((q,i)=>{
      const o = q[0]==='mc' ? {t:'mc',q:q[1],o:q[2],e:q[3]} : {t:'tf',q:q[1],a:q[2],e:q[3]};
      o.id = t.id+'_q'+i; o.tid = t.id; this.Q[o.id]=o; return o;
    });
    t.cards = t.cards.map((c2,i)=>({id:t.id+'_c'+i,q:c2[0],a:c2[1],tid:t.id}));
    s.topics.push(t); this.T[t.id]=t;
  },
  subject(c,sid){ return this.careers[c].subjects.find(x=>x.id===sid); }
};
