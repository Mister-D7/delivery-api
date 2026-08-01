const html = `<!DOCTYPE html>
<html lang="en">
<head>
<title>Kaira - {{STORE_NAME}}</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="/templates/kaira/css/vendor.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@9/swiper-bundle.min.css" />
<link rel="stylesheet" href="/templates/kaira/style.css">
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;700&family=Marcellus&display=swap" rel="stylesheet">
</head>
<body class="homepage">

<div class="search-popup">
  <div class="search-popup-container">
    <form role="search" method="get" class="form-group" action="">
      <input type="search" class="form-control border-0 border-bottom" placeholder="Search products...">
      <button type="submit" class="search-submit border-0 position-absolute bg-white" style="top:15px;right:15px">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M21.71 20.29L18 16.61A9 9 0 1 0 16.61 18l3.68 3.68a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.39ZM11 18a7 7 0 1 1 7-7a7 7 0 0 1-7 7Z"/></svg>
      </button>
    </form>
    <h5 class="cat-list-title small mt-3">Categories</h5>
    <ul class="cat-list list-unstyled" id="categoryNav">{{CATEGORIES}}</ul>
  </div>
</div>

<header class="site-header">
  <nav class="navbar navbar-expand-lg">
    <div class="container">
      <a class="navbar-brand" href="#"><h3 class="m-0">{{STORE_NAME}}</h3></a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav mx-auto">
          <li class="nav-item"><a class="nav-link active" href="#">Home</a></li>
          <li class="nav-item"><a class="nav-link" href="#featured-products">Shop</a></li>
          <li class="nav-item"><a class="nav-link" href="#categories">Categories</a></li>
          <li class="nav-item"><a class="nav-link" href="#latest-blog">Blog</a></li>
          <li class="nav-item"><a class="nav-link" href="#subscribe">Contact</a></li>
        </ul>
      </div>
    </div>
  </nav>
</header>

<section class="hero-section py-5" style="background: linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%);">
  <div class="container">
    <div class="swiper main-swiper">
      <div class="swiper-wrapper">
        <div class="swiper-slide">
          <div class="row align-items-center" style="min-height:450px">
            <div class="col-md-6">
              <h6 class="text-uppercase text-muted">New Collection</h6>
              <h1 class="display-4" style="font-family:'Marcellus',serif">Discover Your Style</h1>
              <p class="lead">Explore the latest trends in fashion. Quality pieces for every wardrobe.</p>
              <a href="#" class="btn btn-dark px-4 py-2 text-uppercase">Shop Now</a>
            </div>
            <div class="col-md-6 text-center">
              <img src="/templates/kaira/images/banner-image-1.jpg" alt="" class="img-fluid" style="max-height:400px">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="categories" class="py-5">
  <div class="container">
    <div class="text-center mb-5">
      <h2 style="font-family:'Marcellus',serif">Shop by Category</h2>
      <p class="text-muted">Find exactly what you're looking for</p>
    </div>
    <div class="row g-4">
      <div class="col-md-4">
        <div class="position-relative overflow-hidden rounded">
          <img src="/templates/kaira/images/cat-item1.jpg" alt="" class="img-fluid w-100" style="height:250px;object-fit:cover">
          <div class="position-absolute bottom-0 start-0 w-100 p-3" style="background:linear-gradient(transparent,rgba(0,0,0,.7))">
            <h5 class="text-white m-0">Clothing</h5>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="position-relative overflow-hidden rounded">
          <img src="/templates/kaira/images/cat-item2.jpg" alt="" class="img-fluid w-100" style="height:250px;object-fit:cover">
          <div class="position-absolute bottom-0 start-0 w-100 p-3" style="background:linear-gradient(transparent,rgba(0,0,0,.7))">
            <h5 class="text-white m-0">Accessories</h5>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="position-relative overflow-hidden rounded">
          <img src="/templates/kaira/images/cat-item3.jpg" alt="" class="img-fluid w-100" style="height:250px;object-fit:cover">
          <div class="position-absolute bottom-0 start-0 w-100 p-3" style="background:linear-gradient(transparent,rgba(0,0,0,.7))">
            <h5 class="text-white m-0">Shoes</h5>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="featured-products" class="py-5 bg-light">
  <div class="container">
    <div class="text-center mb-5">
      <h2 style="font-family:'Marcellus',serif">Featured Products</h2>
      <p class="text-muted">Handpicked favorites just for you</p>
    </div>
    <div id="productGrid" class="row g-4">{{PRODUCTS}}</div>
  </div>
</section>

<section class="py-5" style="background:#1a1a2e;color:white">
  <div class="container text-center py-4">
    <h3 class="text-uppercase" style="font-family:'Marcellus',serif;letter-spacing:3px;color:#e94560">Special Collection</h3>
    <h2 class="display-5 my-3">New Season Essentials</h2>
    <p class="mb-4 opacity-75">Up to 40% off on selected items. Limited time offer.</p>
    <a href="#" class="btn btn-light px-5 py-2 text-uppercase">Shop Collection</a>
  </div>
</section>

<section id="latest-blog" class="py-5">
  <div class="container">
    <div class="text-center mb-5">
      <h2 style="font-family:'Marcellus',serif">Style Journal</h2>
      <p class="text-muted">Tips, trends, and inspiration</p>
    </div>
    <div class="row g-4">
      <div class="col-md-4">
        <img src="/templates/kaira/images/post-image1.jpg" alt="" class="img-fluid w-100 rounded" style="height:200px;object-fit:cover">
        <div class="mt-3">
          <small class="text-muted text-uppercase">Fashion Tips</small>
          <h5>10 Ways to Style Your Wardrobe</h5>
        </div>
      </div>
      <div class="col-md-4">
        <img src="/templates/kaira/images/post-image2.jpg" alt="" class="img-fluid w-100 rounded" style="height:200px;object-fit:cover">
        <div class="mt-3">
          <small class="text-muted text-uppercase">Trends</small>
          <h5>Spring/Summer 2024 Trends</h5>
        </div>
      </div>
      <div class="col-md-4">
        <img src="/templates/kaira/images/post-image3.jpg" alt="" class="img-fluid w-100 rounded" style="height:200px;object-fit:cover">
        <div class="mt-3">
          <small class="text-muted text-uppercase">Accessories</small>
          <h5>The Perfect Bag for Every Occasion</h5>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="subscribe" class="py-5 bg-dark text-white">
  <div class="container text-center py-3">
    <h3>Stay in the Loop</h3>
    <p class="opacity-75">Subscribe for exclusive offers and new arrivals.</p>
    <form class="row justify-content-center g-2">
      <div class="col-md-6">
        <input type="email" class="form-control" placeholder="Your email address">
      </div>
      <div class="col-auto">
        <button class="btn btn-light px-4">Subscribe</button>
      </div>
    </form>
  </div>
</section>

<footer class="py-5" style="background:#0f0f1a;color:#aaa">
  <div class="container">
    <div class="row">
      <div class="col-md-4 mb-4">
        <h5 class="text-white">{{STORE_NAME}}</h5>
        <p class="small">Curated fashion for the modern individual. Quality, style, and comfort since 2020.</p>
      </div>
      <div class="col-md-2 mb-4">
        <h6 class="text-white text-uppercase small">Quick Links</h6>
        <ul class="list-unstyled small">
          <li class="pb-1"><a href="#" class="text-white-50 text-decoration-none">About</a></li>
          <li class="pb-1"><a href="#" class="text-white-50 text-decoration-none">Shop</a></li>
          <li class="pb-1"><a href="#" class="text-white-50 text-decoration-none">Blog</a></li>
          <li class="pb-1"><a href="#" class="text-white-50 text-decoration-none">Contact</a></li>
        </ul>
      </div>
      <div class="col-md-3 mb-4">
        <h6 class="text-white text-uppercase small">Customer Care</h6>
        <ul class="list-unstyled small">
          <li class="pb-1"><a href="#" class="text-white-50 text-decoration-none">Shipping Info</a></li>
          <li class="pb-1"><a href="#" class="text-white-50 text-decoration-none">Returns</a></li>
          <li class="pb-1"><a href="#" class="text-white-50 text-decoration-none">FAQ</a></li>
        </ul>
      </div>
      <div class="col-md-3 mb-4 small">
        <h6 class="text-white text-uppercase small">Contact</h6>
        <p class="mb-1">hello@example.com</p>
        <p>+1 (555) 123-4567</p>
      </div>
    </div>
    <hr style="border-color:#333">
    <p class="text-center small m-0">© {{STORE_NAME}}. All rights reserved.</p>
  </div>
</footer>

<script src="/templates/kaira/js/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/swiper/swiper-bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.bundle.min.js"></script>
<script src="/templates/kaira/js/plugins.js"></script>
<script src="/templates/kaira/js/script.min.js"></script>
</body>
</html>`;

export default {
  id: 'kaira-clothes',
  name: 'Kaira',
  storeType: 'clothes' as const,
  description: 'Bootstrap 5 mode — design luxe, tons sombres, Swiper carousel',
  preview: '',
  theme: {
    fontFamily: "'Jost', 'Marcellus', serif",
    bgColor: '#ffffff',
    surfaceColor: '#f8f9fa',
    textColor: '#1a1a2e',
    accentColor: '#e94560',
    glowColor: '#e2d1c3',
    glowEnabled: false,
    animationEnabled: true,
    glassEnabled: false,
  },
  html,
};
