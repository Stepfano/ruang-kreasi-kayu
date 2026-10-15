import React, { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Heart, LogOut, Menu, Search, X } from "lucide-react";
import { createOrder, getOrders, getProduct, getProducts, requestPasswordReset, resetPassword } from "./api.js";
import { useAuth } from "./AuthContext.jsx";
import { trackEvent, trackPageView } from "./analytics.js";
import { additionalProducts } from "../../shared/additionalProducts.js";

const money = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const orderStatusLabels = {
  processing: "Sedang diproses",
  shipped: "Sedang dikirim",
  received: "Sudah diterima"
};

function readOrders(email) {
  try {
    return JSON.parse(localStorage.getItem(`ruang-kreasi-orders-${email}`)) || [];
  } catch {
    return [];
  }
}

function WoodLogMark() {
  return <svg className="wood-log-mark" viewBox="0 0 48 48" aria-hidden="true"><path d="M8 14c0-5 7-9 16-9s16 4 16 9v20c0 5-7 9-16 9S8 39 8 34V14Z" fill="#c77b3f" stroke="#70442a" strokeWidth="2.5"/><ellipse cx="24" cy="14" rx="16" ry="9" fill="#f0c17a" stroke="#70442a" strokeWidth="2.5"/><ellipse cx="24" cy="14" rx="10.5" ry="5.4" fill="none" stroke="#a45d32" strokeWidth="1.8"/><ellipse cx="24" cy="14" rx="4.2" ry="2.3" fill="none" stroke="#a45d32" strokeWidth="1.5"/><path d="M9 33c4 3 8 4 15 4s12-1 15-4" fill="none" stroke="#8f542f" strokeWidth="1.4" opacity=".85"/></svg>;
}
const fallbackProducts = [
  { _id: "beruang-bara", name: "Bara si Beruang", slug: "beruang-bara", category: "Figur hewan", price: 185000, description: "Konon, Bara adalah penjaga kecil rimba yang selalu mengantar pulang siapa pun yang tersesat sebelum matahari terbenam. Ia dipahat dari kayu solid dengan tekstur faset yang dibiarkan tampak, seolah membawa jejak pepohonan di tubuhnya. Letakkan Bara di meja atau rak sebagai pengingat untuk pulang dengan hati tenang.", image: "/images/woodcraft-figures.png", imageTile: 0, badge: "Favorit" },
  { _id: "kucing-cika", name: "Cika si Kucing", slug: "kucing-cika", category: "Figur hewan", price: 175000, description: "Setiap pagi, Cika si kucing jingga berkeliling studio, mengendus serutan kayu dan menyapa teman-teman yang baru selesai dipahat. Syal birunya jadi tanda bahwa ia selalu siap menemani perjalanan kecil, dari rak buku menuju meja belajar, membawa rasa ingin tahu ke mana pun ia duduk. Figur ini menampilkan faset pahat tangan dan serat kayu alami.", image: "/images/woodcraft-figures.png", imageTile: 1, badge: "Warna baru" },
  { _id: "kodok-kori", name: "Kori si Kodok", slug: "kodok-kori", category: "Figur hewan", price: 165000, description: "Kori paling suka duduk di tepi kolam setelah hujan, menghitung riak sambil menunggu teman-temannya datang. Perut kayu berwarna madu dan senyumnya yang lebar mengingatkan kita bahwa hari biasa pun bisa terasa menyenangkan. Ia dipahat dengan faset tegas dan berdiri di atas tatakan kayu bundar.", image: "/images/woodcraft-figures.png", imageTile: 2, badge: "Bestseller" },
  { _id: "bebek-dara", name: "Dara si Bebek", slug: "bebek-dara", category: "Figur hewan", price: 155000, description: "Dara suka memimpin barisan kecil melewati kebun, dengan topi mungil dan syal hijau kesayangannya. Warna kuningnya yang cerah dibuat dengan sentuhan cat tangan, sementara tekstur pahat dan serat kayunya tetap terlihat. Ia membawa suasana pagi yang cerah ke rak atau meja.", image: "/images/woodcraft-figures.png", imageTile: 3, badge: "Cerah sekali" },
  { _id: "penjaga-rimba", name: "Penjaga Rimba", slug: "penjaga-rimba", category: "Karakter cerita", price: 195000, description: "Penjaga Rimba selalu berjalan paling depan saat teman-teman kecil menjelajah hutan. Jubah merahnya terlihat mencolok di antara pepohonan, tetapi hatinya lembut dan suka menolong. Figur ini dipahat dari kayu dengan gurat faset pada jubah dan wajah hangat yang diukir tangan.", image: "/images/woodcraft-figures.png", imageTile: 4, badge: "Edisi studio" },
  { _id: "kelinci-lumi", name: "Lumi si Kelinci", slug: "kelinci-lumi", category: "Figur hewan", price: 185000, description: "Lumi suka menyimpan biji-bijian dan catatan kecil di dalam tasnya, lalu membaginya saat teman-teman membutuhkan bantuan. Telinganya tegak untuk mendengar cerita dari seluruh penjuru rimba. Warna krem kayu dan syal biru membuat Lumi tampak lembut, dengan detail pahat yang tetap terasa di tangan.", image: "/images/woodcraft-figures.png", imageTile: 5, badge: "Dibuat lokal" },
  ...additionalProducts
];

function useCatalog() {
  const [products, setProducts] = useState(fallbackProducts);
  const [notice, setNotice] = useState("");
  useEffect(() => { getProducts().then((r) => { if (r.data?.length) setProducts(r.data); }).catch(() => setNotice("Mode pratinjau · data contoh sedang ditampilkan")); }, []);
  return { products, notice };
}

function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  return <header className="header"><Link className="brand" to="/" aria-label="Ruang Kreasi Kayu beranda"><WoodLogMark/><span>Ruang<br/>Kreasi<br/>Kayu</span></Link><nav className={open ? "nav nav-open" : "nav"} aria-label="Navigasi utama"><NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink><NavLink to="/produk" onClick={() => setOpen(false)}>Produk</NavLink></nav><div className="header-actions"><Link to="/produk" className="icon-button search-button" aria-label="Cari produk"><Search size={19}/></Link>{user ? <Link className="account-link" to="/akun">Akun</Link> : <Link className="account-link" to="/login">Masuk</Link>}<button className="icon-button menu-button" onClick={() => setOpen(!open)} aria-label={open ? "Tutup menu" : "Buka menu"}>{open ? <X size={21}/> : <Menu size={21}/>}</button></div></header>;
}

function getProductArtStyle(product) {
  const tile = Number(product.imageTile || 0);
  const image = product.image || "/images/woodcraft-figures.png";
  const offsets = ["7.5%", "0%", "-2.5%", "4%", "0%", "-3%"];
  return { backgroundImage: `url(${image})`, "--tile-x": `${(tile % 3) * 50}%`, "--tile-y": `${Math.floor(tile / 3) * 100}%`, "--tile-offset-x": image.endsWith("woodcraft-figures.png") ? offsets[tile] || "0%" : "0%" };
}

function ProductCard({ product, index = 0 }) {
  const artStyle = getProductArtStyle(product);
  const { isWishlisted, toggleWishlist } = useAuth();
  const saved = isWishlisted(product);
  return <article className="product-card" style={{ "--delay": `${index * 70}ms` }}><Link to={`/produk/${product.slug || product._id}`} className="product-image"><span className="product-art" style={artStyle} role="img" aria-label={product.name}/><span className="product-badge">{product.badge || product.category}</span><span className="quick-view">Lihat produk <ArrowRight size={15}/></span></Link><div className="product-meta"><div><span className="product-category">{product.category}</span><h3><Link to={`/produk/${product.slug || product._id}`}>{product.name}</Link></h3></div><button className={saved ? "heart-button is-saved" : "heart-button"} onClick={() => toggleWishlist(product)} aria-label={saved ? `Hapus ${product.name} dari favorit` : `Simpan ${product.name} ke favorit`} aria-pressed={saved}><Heart size={18} fill={saved ? "currentColor" : "none"}/></button></div><p className="product-price">{money(product.price)}</p></article>;
}

function ProductGrid({ products }) {
  const gridClass = products.length === 1 ? "product-grid single-product" : "product-grid";
  return <div className={gridClass}>{products.map((product, i) => <ProductCard key={product._id || product.slug} product={product} index={i}/>)}</div>;
}

function Home() {
  const { products } = useCatalog();
  return <><Header/><main><section className="hero"><div className="hero-copy"><span className="eyebrow"><span className="eyebrow-line"/> Figur Kayu Unik, Koleksi Istimewa</span><h1>Cerita Besar<br/>Di Balik<br/><em>Ukiran Kayu Kecil.</em></h1><p>Figur kayu pahat tangan yang ceria, untuk koleksi penuh karakter dan cerita.</p><div className="hero-cta"><Link className="button button-dark" to="/produk">Pilih Karakter Favorit <ArrowRight size={17}/></Link></div></div><div className="hero-visual"><img src="/images/woodcraft-studio.png" alt="Figur hewan kayu berwarna cerah di studio pahat"/><div className="hero-stamp"><span>carved by hand</span><strong>small<br/>wooden<br/>stories</strong><span>✳ &nbsp; made locally</span></div><div className="hero-caption"><span>01 / 06</span><span>Kayu, warna, dan cerita kecil</span></div></div><div className="hero-side-label">WOODEN FRIENDS FOR EVERY DAY</div></section>
    <section className="trust-strip"><div><span>01</span><p>Dipahat<br/><strong>satu per satu</strong></p></div><div><span>02</span><p>Serat kayu<br/><strong>tetap terlihat</strong></p></div><div><span>03</span><p>Warna ceria<br/><strong>dilukis tangan</strong></p></div><div className="trust-mark">✳</div></section>
    <section className="section collection-section" id="koleksi"><div className="section-heading"><div><h2>Kenalan dengan mereka</h2></div><div className="section-intro"><Link className="text-link" to="/produk">Lihat semua karakter <ArrowRight size={17}/></Link></div></div><ProductGrid products={products.slice(0, 4)}/></section>
    <section className="editorial" id="cerita"><div className="editorial-image"><img src="/images/woodcraft-workshop.png" alt="Pengrajin memahat figur beruang kayu di studio" loading="lazy"/><span className="image-index">CATATAN STUDIO · 01</span></div><div className="editorial-copy"><span className="eyebrow"><span className="eyebrow-line"/> Dari studio kecil kami</span><h2>Kayu Alami,<br/><em>Membawa Kegembiraan Hati.</em></h2><p>Di studio kecil kami, serpihan kayu menumpuk di samping sketsa dan alat pahat. Kami mulai dari sepotong kayu, mencari karakter di seratnya, lalu memahat wajah dan tubuhnya perlahan. Warna merah, hijau, dan kuning hadir sebagai sentuhan akhir, sementara gurat kayu tetap dibiarkan bercerita.</p><span className="editorial-seal">Pahat<br/>tangan<br/>lokal <b>✳</b></span></div></section>
    <section className="newsletter"><h2>Hal baik, sesekali masuk ke <em>inbox</em>.</h2><small>Tak banyak, tak akan memenuhi inbox. Janji.</small><form onSubmit={(e) => {e.preventDefault(); e.currentTarget.reset(); alert("Terima kasih! Kamu sudah masuk daftar kabar kami.");}}><label className="sr-only" htmlFor="email">Alamat email</label><input id="email" type="email" placeholder="Alamat email kamu" required/><button aria-label="Daftar newsletter"><ArrowRight size={19}/></button></form></section>
  </main><Footer/></>;
}

function Catalog() {
  const { products, notice } = useCatalog();
  const [filter, setFilter] = useState("Semua");
  const [search, setSearch] = useState("");

  const categories = ["Semua", ...new Set(products.map((product) => product.category))];
  const visibleProducts = products.filter((product) => {
    const matchesCategory = filter === "Semua" || product.category === filter;
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Header />
      <main className="catalog-page">
        <div className="breadcrumb">
          <Link to="/">Beranda</Link>
          <span>/</span>
          <span>Semua produk</span>
        </div>

        <div className="catalog-heading">
          <div>
            <span className="eyebrow"><span className="eyebrow-line" /> Teman-teman kayu</span>
            <h1>Pilih teman <em>kecilmu.</em></h1>
          </div>
          <p>Setiap figur dipahat tangan dari kayu alami dan diberi aksen warna yang ceria.</p>
        </div>

        <div className="catalog-tools">
          <div className="filters" aria-label="Filter kategori">
            {categories.map((category) => (
              <button
                className={filter === category ? "filter active" : "filter"}
                key={category}
                onClick={() => setFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <label className="catalog-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari karakter..."
              aria-label="Cari produk"
            />
          </label>
        </div>

        {notice && <p className="api-notice">{notice}</p>}
        {visibleProducts.length > 0 ? (
          <ProductGrid products={visibleProducts} />
        ) : (
          <div className="empty-state">
            <span>✳</span>
            <h2>Belum ketemu.</h2>
            <p>Coba kata kunci atau kategori yang lain, ya.</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(() => fallbackProducts.find((item) => item.slug === slug || item._id === slug));
  const [quantity, setQuantity] = useState(1);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const { user, isWishlisted, toggleWishlist } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    setProduct(fallbackProducts.find((item) => item.slug === slug || item._id === slug));
    getProduct(slug).then(setProduct).catch(() => {});
  }, [slug]);

  if (!product) return <><Header/><main className="not-found"><span>✳</span><h1>Karakter ini belum kami temukan.</h1><Link className="button button-dark" to="/produk">Kembali ke koleksi <ArrowRight size={17}/></Link></main><Footer/></>;

  const productSpec = `${product.name} — figur kayu pahat tangan, ${product.category.toLowerCase()}, jumlah ${quantity}`;
  async function handleOrderSubmit(event) {
    event.preventDefault();
    if (!user?.email) {
      setOrderMessage("Masuk ke akun agar pesanan bisa tersimpan di daftar pesanan.");
      return;
    }

    try {
      await createOrder({
        productId: product.slug || product._id,
        productName: product.name,
        quantity,
        unitPrice: product.price
      });
      setOrderMessage("Pesanan tersimpan di database dengan status Sedang diproses.");
    } catch {
      setOrderMessage("Pesanan belum tersimpan. Pastikan koneksi ke server dan database tersedia.");
    }
  }

  return <><Header/><main className="detail-page">
    <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/produk">Produk</Link><span>/</span><span>{product.name}</span></div>
    <div className="detail-layout">
      <div className="detail-image"><span className="detail-art" style={getProductArtStyle(product)} role="img" aria-label={product.name}/><span className="product-badge">{product.badge || product.category}</span></div>
      <div className="detail-copy"><span className="eyebrow"><span className="eyebrow-line"/> {product.category}</span><div className="detail-title-row"><h1>{product.name}</h1><button className={isWishlisted(product) ? "heart-button detail-heart is-saved" : "heart-button detail-heart"} onClick={() => toggleWishlist(product)} aria-label={isWishlisted(product) ? `Hapus ${product.name} dari favorit` : `Simpan ${product.name} ke favorit`} aria-pressed={isWishlisted(product)}><Heart size={22} fill={isWishlisted(product) ? "currentColor" : "none"}/></button></div><p className="detail-price">{money(product.price)}</p><div className="detail-rule"/>
        <p className="detail-description">{product.description}</p><div className="detail-stock"><span className="stock-dot"/> Tersedia · siap dikirim dari studio kami</div>
        <div className="purchase-row"><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Kurangi jumlah">−</button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)} aria-label="Tambah jumlah">+</button></div><button className="button button-dark add-button" onClick={() => { setOrderMessage(""); setOrderOpen(true); }}>Order Now <ArrowRight size={17}/></button></div>
        <p className="shipping-note">✳ &nbsp; Dibungkus aman, dengan sedikit serutan kayu dari studio.</p>
        <div className="detail-accordion"><details><summary>Tentang pahatan ini <span>＋</span></summary><p>Dipahat satu per satu dari kayu, dengan aksen warna yang dilukis tangan. Bentuk, serat, dan detail kecil bisa sedikit berbeda—itulah bagian dari keistimewaannya.</p></details><details><summary>Pengiriman & perawatan <span>＋</span></summary><p>Simpan di tempat kering dan bersihkan dengan kain lembut. Pesanan diproses dalam 1–2 hari kerja.</p></details></div>
      </div>
    </div>
    {orderOpen && <div className="order-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setOrderOpen(false); }}><section className="order-dialog" role="dialog" aria-modal="true" aria-labelledby="order-title"><button className="order-close" type="button" onClick={() => setOrderOpen(false)} aria-label="Tutup formulir"><X size={20}/></button><span className="eyebrow"><span className="eyebrow-line"/> Ruang Kreasi Kayu</span><h2 id="order-title">Formulir Pemesanan</h2><p className="order-intro">Lengkapi detail berikut untuk {product.name}.</p><form className="order-form" onSubmit={handleOrderSubmit}><label>Nama<input name="name" autoComplete="name" required/></label><label className="order-wide">Nama produk & spesifikasi<input name="item" value={productSpec} readOnly/></label><label className="order-wide">Alamat lengkap<textarea name="address" autoComplete="street-address" rows="3" required/></label><label>Alamat email<input name="email" type="email" autoComplete="email" required/></label><label>Nomor telepon<input name="phone" type="tel" autoComplete="tel" required/></label><label className="order-wide">Catatan tambahan <span className="optional-label">Opsional</span><textarea name="notes" rows="2"/></label>{orderMessage && <p className="order-message" role="status">{orderMessage}</p>}<div className="order-actions"><button className="button button-dark" type="submit">Kirim Pesanan <ArrowRight size={17}/></button></div></form></section></div>}
    <section className="section related"><div className="section-heading compact"><div><span className="eyebrow"><span className="eyebrow-line"/> Bisa jadi teman yang cocok</span><h2>Temukan <em>pasangannya.</em></h2></div><Link className="text-link" to="/produk">Lihat semua <ArrowRight size={17}/></Link></div><ProductGrid products={fallbackProducts.filter((item) => item.slug !== product.slug).slice(0, 3)}/></section>
  </main><Footer/></>;
}

function AuthPage({ mode = "login" }) {
  const isRegister = mode === "register";
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to="/akun" replace/>;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      if (isRegister) {
        await register(form.get("name"), form.get("email"), form.get("password"));
        trackEvent("sign_up", { method: "email" });
      } else {
        await login(form.get("email"), form.get("password"));
        trackEvent("login", { method: "email" });
      }
      navigate(location.state?.from || "/akun", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Tidak dapat tersambung ke server. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return <><Header/><main className="auth-page"><Link className="auth-back" to="/">← Kembali ke beranda</Link><span className="eyebrow"><span className="eyebrow-line"/> Ruang Kreasi Kayu</span><h1>{isRegister ? "Buat akun" : "Selamat datang"}<br/><em>{isRegister ? "teman baru." : "kembali."}</em></h1><p>{isRegister ? "Simpan cerita dan pilihan karakter favoritmu." : "Masuk untuk membuka halaman akunmu."}</p><form className="auth-form" onSubmit={handleSubmit}>{isRegister && <label>Nama lengkap<input name="name" type="text" autoComplete="name" minLength="2" maxLength="80" required/></label>}<label>Email<input name="email" type="email" autoComplete="email" required/></label><label>Kata sandi<input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength="8" required/><span className="password-help"><small>Gunakan minimal 8 karakter.</small>{!isRegister && <Link className="forgot-link" to="/lupa-password">Lupa password?</Link>}</span></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="button button-dark" disabled={submitting}>{submitting ? "Memproses…" : isRegister ? "Daftar" : "Masuk"} <ArrowRight size={17}/></button></form><p className="auth-switch">{isRegister ? "Sudah punya akun?" : "Belum punya akun?"} <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Masuk" : "Daftar sekarang"}</Link></p></main><Footer/></>;
}

function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      const form = new FormData(event.currentTarget);
      const result = await requestPasswordReset(form.get("email"));
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Tidak dapat tersambung ke server. Coba lagi.");
    } finally { setSubmitting(false); }
  }
  return <><Header/><main className="auth-page"><Link className="auth-back" to="/login">← Kembali ke halaman masuk</Link><span className="eyebrow"><span className="eyebrow-line"/> Bantuan akun</span><h1>Lupa kata<br/><em>sandi?</em></h1><p>Masukkan email akunmu. Kami akan mengirim tautan untuk membuat kata sandi baru.</p><form className="auth-form" onSubmit={handleSubmit}><label>Email<input name="email" type="email" autoComplete="email" required/></label>{error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-success" role="status">{message}</p>}<button className="button button-dark" disabled={submitting}>{submitting ? "Mengirim…" : "Kirim tautan"} <ArrowRight size={17}/></button></form></main><Footer/></>;
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage("");
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (password !== form.get("confirmPassword")) {
      setError("Konfirmasi kata sandi belum sama.");
      setSubmitting(false);
      return;
    }
    try {
      const result = await resetPassword(token, password);
      setMessage(result.message);
      formElement.reset();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Tidak dapat tersambung ke server. Coba lagi.");
    } finally { setSubmitting(false); }
  }
  return <><Header/><main className="auth-page"><Link className="auth-back" to="/lupa-password">← Minta tautan baru</Link><span className="eyebrow"><span className="eyebrow-line"/> Keamanan akun</span><h1>Buat kata<br/><em>sandi baru.</em></h1><p>Pilih kata sandi minimal 8 karakter untuk akunmu.</p>{!token && <p className="auth-error" role="alert">Tautan pemulihan tidak ditemukan. Minta tautan baru.</p>}<form className="auth-form" onSubmit={handleSubmit}><label>Kata sandi baru<input name="password" type="password" autoComplete="new-password" minLength="8" required disabled={!token}/></label><label>Ulangi kata sandi<input name="confirmPassword" type="password" autoComplete="new-password" minLength="8" required disabled={!token}/></label>{error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-success" role="status">{message} <button type="button" className="inline-login-link" onClick={() => navigate("/login")}>Masuk</button></p>}<button className="button button-dark" disabled={submitting || !token}>{submitting ? "Menyimpan…" : "Simpan kata sandi"} <ArrowRight size={17}/></button></form></main><Footer/></>;
}

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <main className="auth-page"><p>Memeriksa sesi akun…</p></main>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }}/>;
  return children;
}

function AccountPage() {
  const { user, logout, wishlistIds } = useAuth();
  const { products } = useCatalog();
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState(() => readOrders(user.email));
  const savedProducts = products.filter((product) => wishlistIds.includes(product.slug || product._id));

  useEffect(() => {
    getOrders().then((result) => {
      setOrders(result.data);
      localStorage.setItem(`ruang-kreasi-orders-${user.email}`, JSON.stringify(result.data));
    }).catch(() => {
      setOrders(readOrders(user.email));
    });
  }, [user.email]);
  return (
    <>
      <Header />
      <main className="account-page">
        <div className="account-toolbar">
          <button className="account-logout" onClick={logout}>
            <LogOut size={18} /> Keluar
          </button>
        </div>

        <div className="account-content">
          <span className="eyebrow"><span className="eyebrow-line" /> Halaman pribadi</span>
          <h1>Halo, <em>{user.name}.</em></h1>
          <p>Kamu masuk sebagai {user.email}.</p>
          <Link className="button button-dark" to="/produk">
            Jelajahi karakter <ArrowRight size={17} />
          </Link>

          <div className="account-tabs" role="tablist" aria-label="Menu akun">
            <button
              id="orders-tab"
              className={activeTab === "orders" ? "account-tab active" : "account-tab"}
              role="tab"
              aria-selected={activeTab === "orders"}
              aria-controls="orders-panel"
              onClick={() => setActiveTab("orders")}
            >
              Pesanan
            </button>
            <button
              id="wishlist-tab"
              className={activeTab === "wishlist" ? "account-tab active" : "account-tab"}
              role="tab"
              aria-selected={activeTab === "wishlist"}
              aria-controls="wishlist-panel"
              onClick={() => setActiveTab("wishlist")}
            >
              Wishlist
            </button>
          </div>

          {activeTab === "orders" ? (
            <section className="account-panel" id="orders-panel" role="tabpanel" aria-labelledby="orders-tab">
              <div className="section-heading compact">
                <div>
                  <span className="eyebrow"><span className="eyebrow-line" /> Riwayat belanja</span>
                  <h2>Pesanan <em>kamu.</em></h2>
                </div>
              </div>

              {orders.length ? (
                <div className="order-list">
                  {orders.map((order) => (
                    <article className="account-order" key={order.id}>
                      <div className="order-card-heading">
                        <div>
                          <span className="order-number">{order.id || `RK-${String(order._id).slice(-8)}`}</span>
                          <h3>{order.productName}</h3>
                        </div>
                        <span className={`order-status status-${order.status}`}>
                          {orderStatusLabels[order.status] || orderStatusLabels.processing}
                        </span>
                      </div>
                      <div className="order-card-details">
                        <span>{new Date(order.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}</span>
                        <span>{order.quantity} produk</span>
                        <strong>{money(order.total)}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="wishlist-empty">
                  Belum ada pesanan. Pesanan yang kamu buat akan muncul di sini beserta statusnya.
                </p>
              )}
            </section>
          ) : (
            <section className="account-panel" id="wishlist-panel" role="tabpanel" aria-labelledby="wishlist-tab">
              <div className="section-heading compact">
                <div>
                  <span className="eyebrow"><span className="eyebrow-line" /> Pilihanmu</span>
                  <h2>Calon teman <em>barumu</em></h2>
                </div>
              </div>
              {savedProducts.length ? (
                <ProductGrid products={savedProducts} />
              ) : (
                <p className="wishlist-empty">
                  Belum ada karakter tersimpan. Pilih ikon hati pada produk untuk menambahkannya di sini.
                </p>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function PageTracker() {
  const location = useLocation();
  useEffect(() => trackPageView(`${location.pathname}${location.search}`), [location.pathname, location.search]);
  return null;
}

function Footer() { return <footer className="footer"><div className="footer-top"><Link className="brand footer-brand" to="/"><WoodLogMark/><span>Ruang<br/>Kreasi<br/>Kayu</span></Link><p>Figur kayu kecil, cerita besar dan ceria.</p></div><div className="footer-bottom"><span>© 2026 Ruang Kreasi Kayu</span><span>Dipahat dengan ceria di Indonesia <span className="footer-flower">✳</span></span><div><a href="mailto:hallo@ruangkreasi.id">Hubungi kami</a><a href="/produk">Koleksi</a></div></div></footer>; }

function NotFound() { return <><Header/><main className="not-found"><span>404 · ✳</span><h1>Sepertinya kamu<br/><em>tersesat sebentar.</em></h1><Link className="button button-dark" to="/">Kembali ke beranda <ArrowLeft size={17}/></Link></main><Footer/></>; }

export default function App() { return <><PageTracker/><Routes><Route path="/" element={<Home/>}/><Route path="/produk" element={<Catalog/>}/><Route path="/produk/:slug" element={<ProductDetail/>}/><Route path="/login" element={<AuthPage/>}/><Route path="/register" element={<AuthPage mode="register"/>}/><Route path="/lupa-password" element={<ForgotPasswordPage/>}/><Route path="/reset-password" element={<ResetPasswordPage/>}/><Route path="/akun" element={<ProtectedRoute><AccountPage/></ProtectedRoute>}/><Route path="*" element={<NotFound/>}/></Routes></>; }
