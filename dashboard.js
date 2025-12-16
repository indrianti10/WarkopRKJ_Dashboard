import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ================= SUPABASE =================
const supabaseUrl = 'https://srrtqiqbgchszgqavzuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycnRxaXFiZ2Noc3pncWF2enVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTA5NjYsImV4cCI6MjA4MTM2Njk2Nn0.1ToPgwgn1o2cAoNqFE1F7WtKQs32dat1QU64pD8UyF0';
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= ELEMENT =================
const produkTable = document.getElementById('produkTable');
const totalProdukEl = document.getElementById('totalProduk');
const totalFavoritEl = document.getElementById('totalFavorit');
const produkForm = document.getElementById('produkForm');
const btnTambah = document.getElementById('btnTambah');
const modalTitle = document.getElementById('modalTitle');
const favoritContainer = document.getElementById('favoritContainer');
const fileInput = document.getElementById('gambarFile');
const hapusModal = new bootstrap.Modal(document.getElementById('hapusModal'));
const hapusNama = document.getElementById('hapusNama');
const btnKonfirmasiHapus = document.getElementById('btnKonfirmasiHapus');
let hapusId = null;
const produkModal = new bootstrap.Modal(
  document.getElementById('produkModal')
);

// ================= RENDER TABLE =================
async function renderTable() {
  const { data, error } = await supabase.from('produk').select('*');
  if (error) return console.error(error);

  produkTable.innerHTML = '';
  totalProdukEl.textContent = data.length;
  totalFavoritEl.textContent = data.filter(p => p.favorit).length;

  data.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${p.gambar ?? ''}" width="50"></td>
      <td>${p.nama}</td>
      <td>${p.kategori}</td>
      <td>Rp ${p.harga.toLocaleString()}</td>
      <td>${p.favorit ? '⭐' : ''}</td>
      <td>
        <button class="btn btn-warning btn-sm btn-edit" data-id="${p.id}">
          Edit
        </button>
        <button class="btn btn-danger btn-sm btn-hapus" data-id="${p.id}">
          Hapus
        </button>
      </td>
    `;
    produkTable.appendChild(tr);
  });
}

// ================= RENDER FAVORIT (INDEX) =================
async function renderFavorit() {
  if (!favoritContainer) return; // supaya tidak error di halaman lain

  const { data, error } = await supabase
    .from('produk')
    .select('*')
    .eq('favorit', true);

  if (error) return console.error(error);

  favoritContainer.innerHTML = '';

  if (data.length === 0) {
    favoritContainer.innerHTML =
      '<p class="text-muted">Belum ada produk favorit</p>';
    return;
  }

  data.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-md-3 mb-3';

    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <img src="${p.gambar ?? ''}" class="card-img-top"
             style="height:150px; object-fit:cover">
        <div class="card-body text-center">
          <h6 class="card-title">${p.nama}</h6>
          <small class="text-muted">${p.kategori}</small>
          <div class="fw-bold mt-2">
            Rp ${p.harga.toLocaleString()}
          </div>
        </div>
      </div>
    `;

    favoritContainer.appendChild(col);
  });
}

// ================= EDIT & HAPUS =================
produkTable.addEventListener('click', async (e) => {

  // ----- EDIT -----
  if (e.target.classList.contains('btn-edit')) {
    const id = e.target.dataset.id;

    const { data, error } = await supabase
      .from('produk')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return alert('Gagal ambil data');

    modalTitle.textContent = 'Edit Produk';
    document.getElementById('produkId').value = data.id;
    document.getElementById('nama').value = data.nama;
    document.getElementById('kategori').value = data.kategori;
    document.getElementById('harga').value = data.harga;
    document.getElementById('favorit').checked = data.favorit;

    produkModal.show();
  }

  // ----- HAPUS -----
  if (e.target.classList.contains('btn-hapus')) {
  hapusId = e.target.dataset.id;

  const row = e.target.closest('tr');
  const nama = row.children[1].innerText;

  hapusNama.textContent = nama;
  hapusModal.show();
}
});

// ================= TAMBAH / EDIT =================
produkForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('produkId').value;
  const file = document.getElementById('gambarFile').files[0];

  let gambarUrl = null;

  // Upload gambar jika ada
  if (file) {
    const fileName = Date.now() + '_' + file.name;
    const { data, error } = await supabase.storage
      .from('produk_images')
      .upload(fileName, file);

    if (error) return alert('Upload gambar gagal');

    gambarUrl = supabase.storage
      .from('produk_images')
      .getPublicUrl(data.path).data.publicUrl;
  }

  const produkData = {
    nama: document.getElementById('nama').value,
    kategori: document.getElementById('kategori').value,
    harga: parseInt(document.getElementById('harga').value),
    favorit: document.getElementById('favorit').checked
  };

  if (gambarUrl) {
    produkData.gambar = gambarUrl;
  }

  if (id) {
    await supabase.from('produk').update(produkData).eq('id', id);
  } else {
    await supabase.from('produk').insert([produkData]);
  }

  produkForm.reset();
  produkModal.hide();
  renderTable();
});

// ================= TOMBOL TAMBAH =================
btnTambah.addEventListener('click', () => {
  modalTitle.textContent = 'Tambah Produk';
  produkForm.reset();
  document.getElementById('produkId').value = '';
  produkModal.show();
});
// ================= KONFIRMASI HAPUS (INI JAWABANNYA) =================
btnKonfirmasiHapus.addEventListener('click', async () => {
  if (!hapusId) return;

  await supabase.from('produk').delete().eq('id', hapusId);
  hapusModal.hide();
  hapusId = null;
  renderTable();
});

// ================= VALIDASI FILE GAMBAR =================
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;

  const allowedTypes = ['image/jpeg', 'image/png'];

  if (!allowedTypes.includes(file.type)) {
    alert('Hanya file JPG dan PNG yang diperbolehkan!');
    fileInput.value = '';
  }
});


// ================= LOAD AWAL =================
renderTable();
renderFavorit();
