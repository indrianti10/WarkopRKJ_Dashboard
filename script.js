document.addEventListener('DOMContentLoaded', function () {

  /* ==============================
     KATEGORI & SUB KATEGORI
  ============================== */
  const kategori = document.getElementById('kategoriUtama');
  const subKategoriWrapper = document.getElementById('subKategoriWrapper');
  const subKategori = document.getElementById('sub_kategori');

  // 🔥 DISAMAKAN DENGAN CHECK DI DATABASE
  const subKategoriMinuman = [
    { value: 'coffee', label: 'Coffee' },
    { value: 'non coffee', label: 'Non Coffee' },
    { value: 'tea', label: 'Tea' }
  ];

  kategori.addEventListener('change', function () {
    const value = this.value;

    // reset sub kategori
    subKategori.innerHTML = '<option value="">-- Pilih Sub Kategori --</option>';

    if (value === 'minuman') {
      subKategoriWrapper.style.display = 'block';
      subKategori.required = true;

      // 🔥 PERUBAHAN ADA DI SINI
      subKategoriMinuman.forEach(item => {
        const option = document.createElement('option');
        option.value = item.value;   // coffee / non coffee / tea
        option.textContent = item.label;
        subKategori.appendChild(option);
      });

    } else {
      subKategoriWrapper.style.display = 'none';
      subKategori.required = false;
      subKategori.value = '';
    }
  });


  /* ==============================
     FORMAT HARGA (TITIK OTOMATIS)
  ============================== */
  const hargaInput = document.getElementById('harga');

  hargaInput.addEventListener('input', function () {
    let angka = this.value.replace(/\D/g, '');
    this.value = formatRibuan(angka);
  });

  function formatRibuan(angka) {
    if (!angka) return '';
    return angka.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // Cegah huruf
  hargaInput.addEventListener('keypress', function (e) {
    if (!/[0-9]/.test(e.key)) e.preventDefault();
  });


  /* ==============================
     SUBMIT FORM (BERSIHKAN HARGA)
  ============================== */
  const form = document.getElementById('produkForm');

  form.addEventListener('submit', function () {
    // hapus titik sebelum simpan
    hargaInput.value = hargaInput.value.replace(/\./g, '');
  });

});
