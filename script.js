document.addEventListener('DOMContentLoaded', function () {

  const kategori = document.getElementById('kategoriUtama');
  const subKategoriWrapper = document.getElementById('subKategoriWrapper');
  const subKategori = document.getElementById('sub_kategori');
  const hargaInput = document.getElementById('harga');

  const subKategoriMinuman = [
    { value: 'coffee', label: 'Coffee' },
    { value: 'non coffee', label: 'Non Coffee' },
    { value: 'tea', label: 'Tea' }
  ];

  kategori.addEventListener('change', function () {
    const value = this.value;

    subKategori.innerHTML =
      '<option value="">-- Pilih Sub Kategori --</option>';

    if (value === 'minuman') {
      subKategoriWrapper.style.display = 'block';
      subKategori.required = true;

      subKategoriMinuman.forEach(item => {
        const option = document.createElement('option');
        option.value = item.value;
        option.textContent = item.label;
        subKategori.appendChild(option);
      });
    } else {
      subKategoriWrapper.style.display = 'none';
      subKategori.required = false;
      subKategori.value = '';
    }
  });

  // bersihkan harga sebelum submit
  document.getElementById('produkForm').addEventListener('submit', () => {
    hargaInput.value = hargaInput.value.replace(/\./g, '');
  });

});
