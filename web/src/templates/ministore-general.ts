const html = `<!DOCTYPE html>
<html>
<head>
<title>MiniStore - {{STORE_NAME}}</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="/templates/ministore/css/bootstrap.min.css">
<link rel="stylesheet" href="/templates/ministore/style.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@9/swiper-bundle.min.css" />
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
<script src="/templates/ministore/js/modernizr.js"></script>
</head>
<body style="background:#f8f9fa">

<header class="site-header header-scrolled position-fixed text-black bg-light">
  <nav class="navbar navbar-expand-lg px-3">
    <div class="container-fluid">
      <a class="navbar-brand" href="#"><img src="/templates/ministore/images/main-logo.png" class="logo" style="height:36px"></a>
      <ul class="navbar-nav text-uppercase justify-content-end align-items-center flex-grow-1 pe-3 d-none d-lg-flex">
        <li class="nav-item"><a class="nav-link me-4 active" href="#">Home</a></li>
        <li class="nav-item"><a class="nav-link me-4" href="#mobile-products">Products</a></li>
        <li class="nav-item"><a class="nav-link me-4" href="#yearly-sale">Sale</a></li>
        <li class="nav-item"><a class="nav-link me-4" href="#latest-blog">Blog</a></li>
      </ul>
    </div>
  </nav>
</header>

<section id="billboard" class="position-relative overflow-hidden bg-light" style="padding-top:80px">
  <div class="swiper main-swiper">
    <div class="swiper-wrapper">
      <div class="swiper-slide">
        <div class="container">
          <div class="row d-flex align-items-center" style="min-height:400px">
            <div class="col-md-6">
              <div class="banner-content">
                <h1 class="display-4 text-uppercase text-dark pb-4">Welcome to {{STORE_NAME}}</h1>
                <p class="pb-4">Discover amazing products at unbeatable prices.</p>
                <a href="#" class="btn btn-dark text-uppercase px-4 py-2">Shop Now</a>
              </div>
            </div>
            <div class="col-md-5">
              <img src="/templates/ministore/images/banner-image.png" alt="banner" class="img-fluid">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="company-services" class="py-5">
  <div class="container">
    <div class="row">
      <div class="col-lg-3 col-md-6 pb-3">
        <div class="d-flex">
          <div class="pe-3"><i class="bi bi-truck" style="font-size:2rem;color:#333"></i></div>
          <div><h5 class="text-uppercase">Free delivery</h5><p class="small">Consectetur adipi elit.</p></div>
        </div>
      </div>
      <div class="col-lg-3 col-md-6 pb-3">
        <div class="d-flex">
          <div class="pe-3"><i class="bi bi-shield-check" style="font-size:2rem;color:#333"></i></div>
          <div><h5 class="text-uppercase">Quality guarantee</h5><p class="small">Dolor sit amet orem.</p></div>
        </div>
      </div>
      <div class="col-lg-3 col-md-6 pb-3">
        <div class="d-flex">
          <div class="pe-3"><i class="bi bi-tag" style="font-size:2rem;color:#333"></i></div>
          <div><h5 class="text-uppercase">Daily offers</h5><p class="small">Amet consectetur adipi.</p></div>
        </div>
      </div>
      <div class="col-lg-3 col-md-6 pb-3">
        <div class="d-flex">
          <div class="pe-3"><i class="bi bi-lock" style="font-size:2rem;color:#333"></i></div>
          <div><h5 class="text-uppercase">100% secure</h5><p class="small">Rem Lopsum dolor sit.</p></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="mobile-products" class="py-4">
  <div class="container">
    <div class="display-header d-flex justify-content-between pb-3">
      <h2 class="text-uppercase">Featured Products</h2>
    </div>
    <div class="row" id="productGrid">{{PRODUCTS}}</div>
  </div>
</section>

<section id="yearly-sale" class="bg-light py-5" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
  <div class="container">
    <div class="row align-items-center">
      <div class="col-md-6">
        <h3 class="text-muted">Special Offer</h3>
        <h2 class="display-5 pb-4 text-uppercase">New Season Sale</h2>
        <p class="pb-3">Up to 50% off on selected items. Limited time only!</p>
        <a href="#" class="btn btn-dark text-uppercase px-4 py-2">Shop Sale</a>
      </div>
    </div>
  </div>
</section>

<section id="latest-blog" class="py-4">
  <div class="container">
    <div class="display-header d-flex justify-content-between pb-3">
      <h2 class="text-uppercase">Latest Posts</h2>
    </div>
    <div class="row">
      <div class="col-lg-4 col-sm-12 pb-3">
        <div><img src="/templates/ministore/images/post-item1.jpg" alt="" class="img-fluid w-100"></div>
        <div class="pt-2 small text-muted">feb 22, 2023 - Gadgets</div>
        <h5><a href="#" class="text-decoration-none text-dark">Get some cool gadgets in 2023</a></h5>
      </div>
      <div class="col-lg-4 col-sm-12 pb-3">
        <div><img src="/templates/ministore/images/post-item2.jpg" alt="" class="img-fluid w-100"></div>
        <div class="pt-2 small text-muted">feb 25, 2023 - Technology</div>
        <h5><a href="#" class="text-decoration-none text-dark">Technology Hack You Won't Get</a></h5>
      </div>
      <div class="col-lg-4 col-sm-12 pb-3">
        <div><img src="/templates/ministore/images/post-item3.jpg" alt="" class="img-fluid w-100"></div>
        <div class="pt-2 small text-muted">feb 22, 2023 - Camera</div>
        <h5><a href="#" class="text-decoration-none text-dark">Top 10 Small Camera In The World</a></h5>
      </div>
    </div>
  </div>
</section>

<footer class="bg-dark text-white py-5">
  <div class="container">
    <div class="row">
      <div class="col-lg-4 pb-3">
        <h5 class="text-uppercase">{{STORE_NAME}}</h5>
        <p class="small">Nisi, purus vitae, ultrices nunc. Sit ac sit suscipit hendrerit.</p>
      </div>
      <div class="col-lg-2 pb-3">
        <h5 class="text-uppercase small">Quick Links</h5>
        <ul class="list-unstyled small">
          <li class="pb-1"><a href="#" class="text-white-50 text-decoration-none">Home</a></li>
          <li class="pb-1"><a href="#" class="text-white-50 text-decoration-none">About</a></li>
          <li class="pb-1"><a href="#" class="text-white-50 text-decoration-none">Shop</a></li>
        </ul>
      </div>
      <div class="col-lg-3 pb-3">
        <h5 class="text-uppercase small">Help & Info</h5>
        <ul class="list-unstyled small">
          <li class="pb-1"><a href="#" class="text-white-50 text-decoration-none">Track Order</a></li>
          <li class="pb-1"><a href="#" class="text-white-50 text-decoration-none">Returns</a></li>
          <li class="pb-1"><a href="#" class="text-white-50 text-decoration-none">Contact Us</a></li>
        </ul>
      </div>
      <div class="col-lg-3 pb-3 small">
        <h5 class="text-uppercase small">Contact</h5>
        <p class="mb-1">yourinfo@gmail.com</p>
        <p>+55 111 222 333 44</p>
      </div>
    </div>
    <hr class="my-3">
    <p class="text-center small m-0">© {{STORE_NAME}}. All rights reserved.</p>
  </div>
</footer>

<script src="/templates/ministore/js/jquery-1.11.0.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/swiper/swiper-bundle.min.js"></script>
<script src="/templates/ministore/js/bootstrap.bundle.min.js"></script>
<script src="/templates/ministore/js/plugins.js"></script>
<script src="/templates/ministore/js/script.js"></script>
</body>
</html>`;

export default {
  id: 'ministore-general',
  name: 'MiniStore',
  storeType: 'general' as const,
  description: 'Bootstrap 5 boutique général — design épuré, Swiper carousel, tons neutres',
  preview: '',
  theme: {
    fontFamily: "'Jost', 'Lato', sans-serif",
    bgColor: '#f8f9fa',
    surfaceColor: '#ffffff',
    textColor: '#212529',
    accentColor: '#343a40',
    glowColor: '#e9ecef',
    glowEnabled: false,
    animationEnabled: true,
    glassEnabled: false,
  },
  html,
};
