/* ---------- данные ---------- */
let rows = [];                 // [{date, km, h, m, drop, speed, cum}, …]
const dateId = d => d.replace(/-/g,'');

/* ---------- DOM ---------- */
const $ = id => document.getElementById(id);
const tbl = $('dataTable');
const addBtn = $('addBtn');
const exportBtn = $('exportBtn');
const importFile = $('importFile');

/* ---------- инициализация ---------- */
buildTable();
buildChart();

/* ---------- слушатели ---------- */
addBtn.onclick = () => {
  const d = $('date').value,
        km = parseFloat($('km').value)||0,
        h  = parseInt($('h').value)||0,
        m  = parseInt($('m').value)||0,
        drop = parseInt($('drop').value)||0;
  if(!d){alert('Укажите дату');return;}
  if(km<=0){alert('Укажите путь');return;}
  if(h===0&&m===0){alert('Укажите время');return;}
  const speed = km / (h + m/60);
  rows.push({date:d, km, h, m, drop, speed});
  rows.sort((a,b)=>a.date.localeCompare(b.date));
  rebuildCum();
  buildTable();
  buildChart();
};

exportBtn.onclick = () => {
  const xml = ['<tracks>'];
  rows.forEach(r=>{
    xml.push(`<row date="${r.date}" km="${r.km}" h="${r.h}" m="${r.m}" drop="${r.drop}" />`);
  });
  xml.push('</tracks>');
  const blob = new Blob([xml.join('\n')],{type:'application/xml'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tracks.xml';
  a.click();
};

importFile.onchange = e => {
  const file = e.target.files[0];
  if(!file)return;
  const reader = new FileReader();
  reader.onload = evt=>{
    const parser = new DOMParser();
    const doc = parser.parseFromString(evt.target.result,'application/xml');
    const arr = [...doc.querySelectorAll('row')].map(n=>({
      date : n.getAttribute('date'),
      km   : parseFloat(n.getAttribute('km')),
      h    : parseInt(n.getAttribute('h')),
      m    : parseInt(n.getAttribute('m')),
      drop : parseInt(n.getAttribute('drop')),
      speed: parseFloat(n.getAttribute('km')) /
             (parseInt(n.getAttribute('h')) + parseInt(n.getAttribute('m'))/60)
    }));
    rows = arr;
    rebuildCum();
    buildTable();
    buildChart();
  };
  reader.readAsText(file);
};

/* ---------- вспомогательные ---------- */
function rebuildCum(){
  let s = 0;
  rows.forEach(r=>{s+=r.km; r.cum = s;});
}
function buildTable(){
  let html = `<thead>
    <tr>
      <th>Дата</th><th>Путь, км</th><th>Время</th>
      <th>Ср. скорость, км/ч</th><th>Перепад, м</th><th>∑ км</th>
    </tr>
  </thead><tbody>`;
  rows.forEach(r=>{
    html += `<tr>
      <td>${r.date}</td>
      <td>${r.km.toFixed(2)}</td>
      <td>${r.h} ч ${r.m} мин</td>
      <td>${r.speed.toFixed(1)}</td>
      <td>${r.drop}</td>
      <td>${r.cum.toFixed(2)}</td>
    </tr>`;
  });
  html += '</tbody>';
  tbl.innerHTML = html;
}
function buildChart(){
  const labels = rows.map(r=>r.date);
  const data   = rows.map(r=>r.km);
  const ctx = $('chart').getContext('2d');
  if(window.myChart) window.myChart.destroy();
  window.myChart = new Chart(ctx,{
    type:'bar',
    data:{
      labels:labels,
      datasets:[{
        label:'Пройдено за день, км',
        data:data,
        backgroundColor:'#4CAF50'
      }]
    },
    options:{
      responsive:true,
      scales:{y:{beginAtZero:true}}
    }
  });
}