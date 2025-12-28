import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(
  'https://ynmecpnwuylphtoqeqko.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlubWVjcG53dXlscGh0b3FlcWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTE0OTQsImV4cCI6MjA4MjM4NzQ5NH0.GEQt2gJGi1o7Dr7Se8jKfPvBMjAkazJcgTum3ZLMQNU'
);

/* ELEMENT */
const produkTable = document.getElementById('produkTable');
const totalProdukEl = document.getElementById('totalProduk');
const totalFavoritEl = document.getElementById('totalFavorit');
const btnTambah = document.getElementById('btnTambah');
const produkForm = document.getElementById('produkForm');
const fileInput = document.getElementById('gambarFile');
const hargaInput = document.getElementById('harga');
const deskripsiInput = document.getElementById('deskripsi');
const filterKategori = document.getElementById('filterKategori');
const paginationEl = document.getElementById('pagination');

const produkModal = new bootstrap.Modal(document.getElementById('produkModal'));
const hapusModal = new bootstrap.Modal(document.getElementById('hapusModal'));

const hapusNama = document.getElementById('hapusNama');
const btnKonfirmasiHapus = document.getElementById('btnKonfirmasiHapus');

let hapusId = null;
let currentPage = 1;
const perPage = 10;

/* FORMAT RUPIAH */
function formatRupiah(angka) {
  return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/* RENDER TABLE & CARD */
async function renderTable() {
  let query = supabase.from('produk').select('*');
  if (filterKategori.value) query = query.eq('kategori', filterKategori.value);
  const { data, error } = await query;
  if (error) return console.error(error);

  const totalData = data.length;
  const totalPages = Math.ceil(totalData / perPage);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const pagedData = data.slice(start, end);

  // Render Table
  produkTable.innerHTML = '';
  pagedData.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${p.gambar ?? ''}" width="50"></td>
      <td>${p.nama}</td>
      <td>${p.kategori}</td>
      <td>Rp ${formatRupiah(p.harga)}</td>
      <td>${p.deskripsi ?? ''}</td>
      <td>${p.favorit ? '⭐' : ''}</td>
      <td>
        <button class="btn btn-warning btn-sm btn-edit" data-id="${p.id}">Edit</button>
        <button class="btn btn-danger btn-sm btn-hapus" data-id="${p.id}">Hapus</button>
      </td>
    `;
    produkTable.appendChild(tr);
  });

  // Update Counters
  totalProdukEl.textContent = totalData;
  totalFavoritEl.textContent = data.filter(p => p.favorit).length;
  document.getElementById('totalMakanan').textContent = data.filter(p => p.kategori === 'makanan').length;
  document.getElementById('totalMinuman').textContent = data.filter(p => p.kategori === 'minuman').length;
  document.getElementById('totalCemilan').textContent = data.filter(p => p.kategori === 'cemilan').length;

  renderPagination(totalPages);
}

/* PAGINATION */
function renderPagination(totalPages) {
  paginationEl.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Previous';
  prevBtn.className = 'btn btn-sm btn-secondary';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => { currentPage--; renderTable(); });
  paginationEl.appendChild(prevBtn);

  const pageInfo = document.createElement('span');
  pageInfo.className = 'mx-2';
  pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
  paginationEl.appendChild(pageInfo);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.className = 'btn btn-sm btn-secondary';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => { currentPage++; renderTable(); });
  paginationEl.appendChild(nextBtn);
}

/* FILTER KATEGORI */
filterKategori.addEventListener('change', () => { currentPage = 1; renderTable(); });

/* TAMBAH PRODUK */
btnTambah.addEventListener('click', () => {
  produkForm.reset();
  document.getElementById('produkId').value = '';
  document.getElementById('modalTitle').textContent = 'Tambah Produk';
  produkModal.show();
});

/* EDIT & HAPUS PRODUK */
produkTable.addEventListener('click', e => {
  const target = e.target;
  if (target.classList.contains('btn-edit')) {
    const id = target.dataset.id;
    supabase.from('produk').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error) return console.error(error);
      document.getElementById('produkId').value = data.id;
      document.getElementById('nama').value = data.nama;
      document.getElementById('kategoriUtama').value = data.kategori;
      document.getElementById('sub_kategori').value = data.sub_kategori || '';
      document.getElementById('harga').value = formatRupiah(data.harga);
      document.getElementById('deskripsi').value = data.deskripsi || '';
      document.getElementById('favorit').checked = data.favorit || false;
      document.getElementById('modalTitle').textContent = 'Edit Produk';
      produkModal.show();
    });
  }

  if (target.classList.contains('btn-hapus')) {
    hapusId = target.dataset.id;
    hapusNama.textContent = target.closest('tr').children[1].innerText;
    hapusModal.show();
  }
});

/* SUBMIT FORM */
produkForm.addEventListener('submit', async e => {
  e.preventDefault();
  const id = document.getElementById('produkId').value;
  const file = fileInput.files[0];
  let gambarUrl = null;

  if (file) {
    const fileName = `produk/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('produk-images').upload(fileName, file);
    if (error) return console.error(error);
    gambarUrl = supabase.storage.from('produk-images').getPublicUrl(data.path).data.publicUrl;
  }

  const produkData = {
    nama: document.getElementById('nama').value,
    kategori: document.getElementById('kategoriUtama').value,
    sub_kategori: document.getElementById('sub_kategori').value || null,
    harga: parseInt(document.getElementById('harga').value.replace(/\./g, '')),
    deskripsi: document.getElementById('deskripsi').value || null,
    favorit: document.getElementById('favorit').checked
  };
  if (gambarUrl) produkData.gambar = gambarUrl;

  const { error } = id
    ? await supabase.from('produk').update(produkData).eq('id', id)
    : await supabase.from('produk').insert([produkData]);
  if (error) return console.error(error);

  produkModal.hide();
  renderTable();
});

/* KONFIRMASI HAPUS */
btnKonfirmasiHapus.addEventListener('click', async () => {
  await supabase.from('produk').delete().eq('id', hapusId);
  hapusModal.hide();
  renderTable();
});

/* AUTO FORMAT HARGA */
hargaInput.addEventListener('input', e => {
  let value = e.target.value.replace(/\./g, '');
  if (!isNaN(value) && value) e.target.value = formatRupiah(value);
  else e.target.value = '';
});

/* INIT */
renderTable();