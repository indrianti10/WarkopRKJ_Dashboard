import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://ynmecpnwuylphtoqeqko.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlubWVjcG53dXlscGh0b3FlcWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTE0OTQsImV4cCI6MjA4MjM4NzQ5NH0.GEQt2gJGi1o7Dr7Se8jKfPvBMjAkazJcgTum3ZLMQNU'
);

/* =====================
   ELEMENT
===================== */
const produkTable = document.getElementById('produkTable');
const produkForm = document.getElementById('produkForm');
const btnTambah = document.getElementById('btnTambah');
const fileInput = document.getElementById('gambarFile');
const hargaInput = document.getElementById('harga');
const filterKategori = document.getElementById('filterKategori');
const paginationEl = document.getElementById('pagination');

const kategoriUtama = document.getElementById('kategoriUtama');
const subKategoriWrapper = document.getElementById('subKategoriWrapper');
const subKategori = document.getElementById('sub_kategori');

const gambarInfo = document.getElementById('gambarInfo');
const namaFileGambar = document.getElementById('namaFileGambar');
const previewGambar = document.getElementById('previewGambar');

const produkModal = new bootstrap.Modal(document.getElementById('produkModal'));
const hapusModal = new bootstrap.Modal(document.getElementById('hapusModal'));

const hapusNama = document.getElementById('hapusNama');
const btnKonfirmasiHapus = document.getElementById('btnKonfirmasiHapus');

const produkId = document.getElementById('produkId');
const gambarLama = document.getElementById('gambarLama');

let hapusId = null;
let currentPage = 1;
const perPage = 10;

/* =====================
   UTIL
===================== */
function formatRibuan(val) {
  return val.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/* =====================
   SUB KATEGORI
===================== */
const subKategoriMinuman = [
  { value: 'coffee', label: 'Coffee' },
  { value: 'non coffee', label: 'Non Coffee' },
  { value: 'tea', label: 'Tea' }
];

kategoriUtama.addEventListener('change', () => {
  subKategori.innerHTML = '<option value="">-- Pilih Sub Kategori --</option>';

  if (kategoriUtama.value === 'minuman') {
    subKategoriWrapper.style.display = 'block';
    subKategori.required = true;

    subKategoriMinuman.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.value;
      opt.textContent = item.label;
      subKategori.appendChild(opt);
    });
  } else {
    subKategoriWrapper.style.display = 'none';
    subKategori.required = false;
    subKategori.value = '';
  }
});

/* =====================
   CARD
===================== */
async function renderCards() {
  const { data } = await supabase.from('produk').select('kategori,favorit');

  document.getElementById('totalProduk').textContent = data.length;
  document.getElementById('totalFavorit').textContent = data.filter(p => p.favorit).length;
  document.getElementById('totalMakanan').textContent = data.filter(p => p.kategori === 'makanan').length;
  document.getElementById('totalMinuman').textContent = data.filter(p => p.kategori === 'minuman').length;
  document.getElementById('totalCemilan').textContent = data.filter(p => p.kategori === 'cemilan').length;
}

/* =====================
   TABLE
===================== */
async function renderTable() {
  let query = supabase
    .from('produk')
    .select('*')
    .order('id', { ascending: false });

  if (filterKategori.value) {
    query = query.eq('kategori', filterKategori.value);
  }

  const { data } = await query;

  const totalPages = Math.ceil(data.length / perPage);
  const start = (currentPage - 1) * perPage;
  const pageData = data.slice(start, start + perPage);

  produkTable.innerHTML = '';

  pageData.forEach(p => {
    produkTable.innerHTML += `
      <tr>
        <td>${p.gambar ? `<img src="${p.gambar}" width="50">` : '-'}</td>
        <td>${p.nama}</td>
        <td>${p.kategori === 'minuman' && p.sub_kategori? `${p.kategori} - ${p.sub_kategori}`: p.kategori}</td>
        <td>Rp ${formatRibuan(String(p.harga))}</td>
        <td>${p.deskripsi ?? ''}</td>
        <td>${p.favorit ? '⭐' : ''}</td>
        <td>
          <button class="btn btn-warning btn-sm btn-edit" data-id="${p.id}">Edit</button>
          <button class="btn btn-danger btn-sm btn-hapus" data-id="${p.id}">Hapus</button>
        </td>
      </tr>
    `;
  });

  renderPagination(totalPages);
}

/* =====================
   PAGINATION
===================== */
function renderPagination(totalPages) {
  paginationEl.innerHTML = `
    <button ${currentPage === 1 ? 'disabled' : ''} id="prev">Prev</button>
    <span>${currentPage} / ${totalPages}</span>
    <button ${currentPage === totalPages ? 'disabled' : ''} id="next">Next</button>
  `;

  document.getElementById('prev').onclick = () => {
    currentPage--;
    renderTable();
  };

  document.getElementById('next').onclick = () => {
    currentPage++;
    renderTable();
  };
}

/* =====================
   FILTER
===================== */
filterKategori.addEventListener('change', () => {
  currentPage = 1;
  renderTable();
});

/* =====================
   TAMBAH (FIX UTAMA)
===================== */
btnTambah.addEventListener('click', () => {
  produkForm.reset();
  produkId.value = '';
  gambarLama.value = '';

  gambarInfo.style.display = 'none';
  previewGambar.src = '';
  namaFileGambar.textContent = '';

  subKategoriWrapper.style.display = 'none';
  subKategori.required = false;

  produkModal.show();
});

/* =====================
   EDIT & HAPUS
===================== */
produkTable.addEventListener('click', async e => {

  if (e.target.classList.contains('btn-edit')) {
    const { data } = await supabase
      .from('produk')
      .select('*')
      .eq('id', e.target.dataset.id)
      .single();

    produkId.value = data.id;
    nama.value = data.nama;
    kategoriUtama.value = data.kategori;
    kategoriUtama.dispatchEvent(new Event('change'));
    subKategori.value = data.sub_kategori ?? '';
    harga.value = formatRibuan(String(data.harga));
    deskripsi.value = data.deskripsi ?? '';
    favorit.checked = data.favorit;
    gambarLama.value = data.gambar ?? '';

    if (data.gambar) {
      previewGambar.src = data.gambar;
      namaFileGambar.textContent = data.gambar.split('/').pop();
      gambarInfo.style.display = 'block';
    }

    produkModal.show();
  }

  if (e.target.classList.contains('btn-hapus')) {
    hapusId = e.target.dataset.id;
    hapusNama.textContent = e.target.closest('tr').children[1].innerText;
    hapusModal.show();
  }
});

/* =====================
   SUBMIT
===================== */
produkForm.addEventListener('submit', async e => {
  e.preventDefault();

  let gambar = gambarLama.value || null;

  if (fileInput.files[0]) {
    const file = fileInput.files[0];
    const name = `${Date.now()}-${file.name}`;
    await supabase.storage.from('produk-images').upload(name, file);
    gambar = supabase.storage.from('produk-images').getPublicUrl(name).data.publicUrl;
  }

  const payload = {
    nama: nama.value,
    kategori: kategoriUtama.value,
    sub_kategori: subKategori.value || null,
    harga: harga.value.replace(/\./g, ''),
    deskripsi: deskripsi.value,
    favorit: favorit.checked,
    gambar
  };

  if (produkId.value) {
    await supabase.from('produk').update(payload).eq('id', produkId.value);
  } else {
    await supabase.from('produk').insert([payload]);
  }

  produkModal.hide();
  produkId.value = '';
  currentPage = 1;
  renderCards();
  renderTable();
});

/* =====================
   KONFIRMASI HAPUS
===================== */
btnKonfirmasiHapus.addEventListener('click', async () => {
  await supabase.from('produk').delete().eq('id', hapusId);
  hapusModal.hide();
  currentPage = 1;
  renderCards();
  renderTable();
});

/* =====================
   FORMAT HARGA
===================== */
hargaInput.addEventListener('input', () => {
  hargaInput.value = formatRibuan(hargaInput.value.replace(/\D/g, ''));
});

/* =====================
   INIT
===================== */
renderCards();
renderTable();