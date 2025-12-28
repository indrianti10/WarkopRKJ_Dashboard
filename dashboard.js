import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://ynmecpnwuylphtoqeqko.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlubWVjcG53dXlscGh0b3FlcWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTE0OTQsImV4cCI6MjA4MjM4NzQ5NH0.GEQt2gJGi1o7Dr7Se8jKfPvBMjAkazJcgTum3ZLMQNU'
);

/* =========================
   ELEMENT
========================= */
const produkTable = document.getElementById('produkTable');
const produkForm = document.getElementById('produkForm');
const btnTambah = document.getElementById('btnTambah');
const fileInput = document.getElementById('gambarFile');
const hargaInput = document.getElementById('harga');
const filterKategori = document.getElementById('filterKategori');
const paginationEl = document.getElementById('pagination');

const produkModal = new bootstrap.Modal(document.getElementById('produkModal'));
const hapusModal = new bootstrap.Modal(document.getElementById('hapusModal'));

const totalProdukEl = document.getElementById('totalProduk');
const totalFavoritEl = document.getElementById('totalFavorit');
const hapusNama = document.getElementById('hapusNama');
const btnKonfirmasiHapus = document.getElementById('btnKonfirmasiHapus');

let hapusId = null;
let currentPage = 1;
const perPage = 10;

/* =========================
   FORMAT HARGA
========================= */
function formatRibuan(angka) {
  return angka.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/* =========================
   RENDER TABLE
========================= */
async function renderTable() {
  let query = supabase.from('produk').select('*');

  if (filterKategori.value) {
    query = query.eq('kategori', filterKategori.value);
  }

  const { data, error } = await query;
  if (error) return console.error(error);

  const totalData = data.length;
  const totalPages = Math.ceil(totalData / perPage);
  const start = (currentPage - 1) * perPage;
  const pagedData = data.slice(start, start + perPage);

  produkTable.innerHTML = '';
  pagedData.forEach(p => {
    produkTable.innerHTML += `
      <tr>
        <td>
          ${p.gambar ? `<img src="${p.gambar}" width="50">` : '-'}
        </td>
        <td>${p.nama}</td>
        <td>${p.kategori}</td>
        <td>${p.harga ?? ''}</td>
        <td>${p.deskripsi ?? ''}</td>
        <td>${p.favorit ? '⭐' : ''}</td>
        <td>
          <button class="btn btn-warning btn-sm btn-edit" data-id="${p.id}">Edit</button>
          <button class="btn btn-danger btn-sm btn-hapus" data-id="${p.id}">Hapus</button>
        </td>
      </tr>
    `;
  });

  totalProdukEl.textContent = totalData;
  totalFavoritEl.textContent = data.filter(p => p.favorit).length;
  document.getElementById('totalMakanan').textContent = data.filter(p => p.kategori === 'makanan').length;
  document.getElementById('totalMinuman').textContent = data.filter(p => p.kategori === 'minuman').length;
  document.getElementById('totalCemilan').textContent = data.filter(p => p.kategori === 'cemilan').length;

  renderPagination(totalPages);
}

/* =========================
   PAGINATION
========================= */
function renderPagination(totalPages) {
  paginationEl.innerHTML = `
    <button class="btn btn-sm btn-secondary" ${currentPage === 1 ? 'disabled' : ''} id="prevPage">Prev</button>
    <span class="mx-2">${currentPage} / ${totalPages}</span>
    <button class="btn btn-sm btn-secondary" ${currentPage === totalPages ? 'disabled' : ''} id="nextPage">Next</button>
  `;

  document.getElementById('prevPage')?.addEventListener('click', () => {
    currentPage--;
    renderTable();
  });

  document.getElementById('nextPage')?.addEventListener('click', () => {
    currentPage++;
    renderTable();
  });
}

/* =========================
   TAMBAH PRODUK
========================= */
btnTambah.addEventListener('click', () => {
  produkForm.reset();
  fileInput.value = '';
  document.getElementById('gambarLama').value = '';
  gambarInfo.style.display = 'none';

  document.getElementById('modalTitle').textContent = 'Tambah Produk';
  produkModal.show();
});


/* =========================
   EDIT & HAPUS
========================= */
produkTable.addEventListener('click', async e => {
  if (e.target.classList.contains('btn-edit')) {
    const id = e.target.dataset.id;

    const { data, error } = await supabase
      .from('produk')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return console.error(error);

    document.getElementById('produkId').value = data.id;
    document.getElementById('nama').value = data.nama;
    document.getElementById('kategoriUtama').value = data.kategori;
    document.getElementById('sub_kategori').value = data.sub_kategori ?? '';
    document.getElementById('harga').value = data.harga ?? '';
    document.getElementById('deskripsi').value = data.deskripsi ?? '';
    document.getElementById('favorit').checked = data.favorit ?? false;

    // 🔐 simpan url gambar lama
    document.getElementById('gambarLama').value = data.gambar ?? '';

    // 🔥 WAJIB kosongkan input file
    fileInput.value = '';

    // =====================
    // TAMPILKAN INFO GAMBAR
    // =====================
    if (data.gambar) {
      const namaFile = data.gambar.split('/').pop();

      namaFileGambar.textContent = namaFile;
      previewGambar.src = data.gambar;
      gambarInfo.style.display = 'block';
    } else {
      gambarInfo.style.display = 'none';
    }

    document.getElementById('modalTitle').textContent = 'Edit Produk';
    produkModal.show();
  }

  if (e.target.classList.contains('btn-hapus')) {
    hapusId = e.target.dataset.id;
    hapusNama.textContent =
      e.target.closest('tr').children[1].innerText;
    hapusModal.show();
  }
});


/* =========================
   SUBMIT FORM (AMAN GAMBAR)
========================= */
produkForm.addEventListener('submit', async e => {
  e.preventDefault();

  const id = document.getElementById('produkId').value;
  const file = fileInput.files[0];

  let gambarUrl = document.getElementById('gambarLama').value || null;

  if (file) {
    const fileName = `produk/${Date.now()}-${file.name}`;
    const { data, error } = await supabase
      .storage
      .from('produk-images')
      .upload(fileName, file, { upsert: false });

    if (error) return alert('Upload gagal');

    gambarUrl = supabase
      .storage
      .from('produk-images')
      .getPublicUrl(data.path).data.publicUrl;
  }

  const produkData = {
    nama: document.getElementById('nama').value,
    kategori: document.getElementById('kategoriUtama').value,
    sub_kategori: document.getElementById('sub_kategori').value || null,
    harga: document.getElementById('harga').value,
    deskripsi: document.getElementById('deskripsi').value || null,
    favorit: document.getElementById('favorit').checked,
    gambar: gambarUrl
  };

  id
    ? await supabase.from('produk').update(produkData).eq('id', id)
    : await supabase.from('produk').insert([produkData]);

  produkModal.hide();
  renderTable();
});

/* =========================
   HAPUS
========================= */
btnKonfirmasiHapus.addEventListener('click', async () => {
  await supabase.from('produk').delete().eq('id', hapusId);
  hapusModal.hide();
  renderTable();
});

/* =========================
   FORMAT HARGA
========================= */
hargaInput.addEventListener('input', () => {
  let value = hargaInput.value.replace(/\D/g, '');
  hargaInput.value = formatRibuan(value);
});

/* =========================
   INIT
========================= */
renderTable();
