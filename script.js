const incomeEl = document.getElementById('income');
const bucketNameEl = document.getElementById('bucketName');
const bucketPercentEl = document.getElementById('bucketPercent');
const addBucketBtn = document.getElementById('addBucket');
const bucketsTbody = document.querySelector('#buckets tbody');
const totalPercentEl = document.getElementById('totalPercent');
const remainingPercentEl = document.getElementById('remainingPercent');
const totalAmountEl = document.getElementById('totalAmount');
const remainingAmountEl = document.getElementById('remainingAmount');
const resetBtn = document.getElementById('reset');
const allocBar = document.getElementById('allocBar');
const countryEl = document.getElementById('country');
const countryNameEl = document.getElementById('countryName');
const suggestionsList = document.getElementById('suggestionsList');
const applySuggestionsBtn = document.getElementById('applySuggestions');
// currency conversion UI removed

const palette = ['#4b7cff','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4'];

let buckets = JSON.parse(localStorage.getItem('buckets') || '[]');
let income = parseFloat(localStorage.getItem('income') || '0');
let country = localStorage.getItem('country') || '';
// conversion state removed

incomeEl.value = income;
if (countryEl) countryEl.value = country;
render();

incomeEl.addEventListener('input', () => {
  income = parseFloat(incomeEl.value) || 0;
  localStorage.setItem('income', income);
  render();
});

if (countryEl) {
  countryEl.addEventListener('input', () => {
    country = countryEl.value.trim();
    localStorage.setItem('country', country);
    updateCountrySuggestions();
  });
}


if (applySuggestionsBtn) applySuggestionsBtn.addEventListener('click', () => {
  applyCountrySuggestions();
});

// AI assistant removed: no local or remote AI calls.

addBucketBtn.addEventListener('click', () => {
  const name = bucketNameEl.value.trim();
  const percent = parseFloat(bucketPercentEl.value);
  if (!name || isNaN(percent) || percent <= 0) return alert('Please enter a name and a positive percent.');
  const totalPercent = buckets.reduce((s, b) => s + b.percent, 0) + percent;
  if (totalPercent > 100) return alert('Total percent would exceed 100%.');
  buckets.push({ id: Date.now(), name, percent });
  saveAndRender();
  bucketNameEl.value = '';
  bucketPercentEl.value = '';
});

function saveAndRender() {
  localStorage.setItem('buckets', JSON.stringify(buckets));
  render();
}

function render() {
  bucketsTbody.innerHTML = '';
  let total = 0;
  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i];
    total += b.percent;
    const amount = (income * b.percent / 100).toFixed(2);
    const color = palette[i % palette.length];
    const tr = document.createElement('tr');
    tr.classList.add('pop');
    tr.innerHTML = `<td>${escapeHtml(b.name)}</td><td><span class="badge" style="background:${color}">${b.percent}%</span><div class="small">$${amount}</div></td><td>$${amount}</td><td><button data-id="${b.id}" class="del secondary">Delete</button></td>`;
    bucketsTbody.appendChild(tr);
  }
  const totalAmount = income * total / 100;
  const remainingPercent = (100 - total);
  const remainingAmount = Math.max(0, income - totalAmount);
  totalPercentEl.textContent = total.toFixed(2) + '%';
  remainingPercentEl.textContent = remainingPercent.toFixed(2) + '%';
  if (totalAmountEl) totalAmountEl.textContent = `$${totalAmount.toFixed(2)}`;
  if (remainingAmountEl) remainingAmountEl.textContent = `$${remainingAmount.toFixed(2)}`;
  if (allocBar) allocBar.style.width = Math.max(0, Math.min(100, total)).toFixed(2) + '%';
  document.querySelectorAll('.del').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      buckets = buckets.filter(x => x.id !== id);
      saveAndRender();
    });
  });
}

resetBtn.addEventListener('click', () => {
  if (!confirm('Reset all data?')) return;
  buckets = [];
  income = 0;
  localStorage.removeItem('buckets');
  localStorage.removeItem('income');
  incomeEl.value = 0;
  render();
});

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// --- Country suggestions ---
const countrySuggestions = {
  'united states': [
    {name:'Emergency Fund', percent:10},
    {name:'Rent/Bills', percent:33},
    {name:'Retirement/401k', percent:8},
    {name:'Savings/Investments', percent:24},
    {name:'Food & Drinks', percent:15},
    {name:'Entertainment', percent:10}
  ],
  'india': [
    {name:'Emergency Fund', percent:10},
    {name:'Family/Household', percent:25},
    {name:'Savings/Investments', percent:28},
    {name:'Bills', percent:15},
    {name:'Goals', percent:12},
    {name:'Food & Drinks', percent:10}
  ],
  'united kingdom': [
    {name:'Emergency Fund', percent:10},
    {name:'Rent/Bills', percent:30},
    {name:'Pension', percent:10},
    {name:'Savings', percent:30},
    {name:'Food & Drinks', percent:12},
    {name:'Leisure', percent:8}
  ],
  'pakistan': [
    {name:'Emergency Fund', percent:10},
    {name:'Household', percent:30},
    {name:'Savings/Investments', percent:30},
    {name:'Education/Goals', percent:20},
    {name:'Food & Drinks', percent:10}
  ],
  'default': [
    {name:'Emergency Fund', percent:10},
    {name:'Needs (rent, bills)', percent:30},
    {name:'Savings/Investments', percent:25},
    {name:'Goals', percent:15},
    {name:'Food & Drinks', percent:12},
    {name:'Fun', percent:8}
  ]
};

function getSuggestionsForCountry(name){
  if (!name) return countrySuggestions.default;
  const key = name.trim().toLowerCase();
  if (countrySuggestions[key]) return countrySuggestions[key];
  // simple matching: check if key contains known words
  if (key.includes('united') && key.includes('states')) return countrySuggestions['united states'];
  if (key.includes('india')) return countrySuggestions['india'];
  if (key.includes('pakistan')) return countrySuggestions['pakistan'];
  if (key.includes('kingdom') || key.includes('uk')) return countrySuggestions['united kingdom'];
  return countrySuggestions['default'];
}

function updateCountrySuggestions(){
  const suggestions = getSuggestionsForCountry(country || countryEl.value);
  countryNameEl.textContent = country || (countryEl && countryEl.value) || 'your country';
  suggestionsList.innerHTML = '';
  for (const s of suggestions){
    const li = document.createElement('li');
    li.textContent = `${s.name} — ${s.percent}%`;
    suggestionsList.appendChild(li);
  }
}

function applyCountrySuggestions(){
  const suggestions = getSuggestionsForCountry(country || (countryEl && countryEl.value));
  buckets = suggestions.map(s => ({ id: Date.now() + Math.random(), name: s.name, percent: s.percent }));
  saveAndRender();
}

// initialize suggestions panel
updateCountrySuggestions();

