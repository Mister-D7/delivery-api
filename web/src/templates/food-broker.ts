const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
    <title>{{STORE_NAME}}</title>
    <meta charset="utf-8">
    <meta name = "format-detection" content = "telephone=no" />
    <link rel="icon" href="/templates/food-broker/images/favicon.ico" type="image/x-icon">
    <link rel="shortcut icon" href="/templates/food-broker/images/favicon.ico" type="image/x-icon" />
    <link rel="stylesheet" href="/templates/food-broker/css/style.css">
    <link rel="stylesheet" href="/templates/food-broker/css/superfish.css">

    <script src="/templates/food-broker/js/jquery.js"></script>
    <script src="/templates/food-broker/js/jquery-migrate-1.1.1.js"></script>
    <script src="/templates/food-broker/js/jquery.easing.1.3.js"></script>
    <script src="/templates/food-broker/js/script.js"></script>
    <script src="/templates/food-broker/js/superfish.js"></script>
    <script src="/templates/food-broker/js/jquery.mobilemenu.js"></script>
    
    <script src="/templates/food-broker/js/jquery.carouFredSel-6.1.0-packed.js"></script>
    <script src="/templates/food-broker/js/jquery.mousewheel.min.js"></script>
    <script src="/templates/food-broker/js/jquery.touchSwipe.min.js"></script>
    <script src="/templates/food-broker/js/jquery.ui.totop.js"></script>
    <script>
        $(window).load(function(){
            $('#foo').carouFredSel({
                auto: false,
                responsive: true,
                width: '100%',
                prev: '#prev1',
                next: '#next1',
                scroll: 1,
                items: {
                    height: 'auto',
                    width: 143,
                    visible: {
                        min: 1,
                        max: 5
                    }
                },
                mousewheel: false,
                swipe: {
                    onMouse: true,
                    onTouch: true
                }
            });
        })
    </script>
    
    <!--[if lt IE 8]>
       <div style=' clear: both; text-align:center; position: relative;'>
         <a href="http://windows.microsoft.com/en-US/internet-explorer/products/ie/home?ocid=ie6_countdown_bannercode">
           <img src="http://storage.ie6countdown.com/assets/100/images/banners/warning_bar_0000_us.jpg" border="0" height="42" width="820" alt="You are using an outdated browser. For a faster, safer browsing experience, upgrade for free today." />
         </a>
      </div>
    <![endif]-->
    <!--[if lt IE 9]>
        <script src="/templates/food-broker/js/html5shiv.js"></script>
        <link rel="stylesheet" type="text/css" media="screen" href="/templates/food-broker/css/ie.css">
    <![endif]-->
    </head>
    <body class="page-1">
<!--==============================header=================================-->
<header>
    <div class="container_12">
        <div class="row">
            <div class="grid_12">
                <h1 class="mb">
                    <a href="#"><img src="/templates/food-broker/images/logo.png" alt="{{STORE_NAME}}"></a>
                    <span>{{TAGLINE}}</span>
                </h1>
                <nav>
                    <ul class="sf-menu">
                        <li class="current"><a href="#">home</a><li><a href="#">company</a></li>
                        <li><a href="#">products</a>
                            <ul>
                                <li><a href="#">columns 01</a></li>
                                <li><a href="#">columns 02</a>
                                <li><a href="#">columns 03</a>
                                    <ul>
                                        <li><a href="#">columns 04</a></li>
                                        <li><a href="#">columns 05</a></li>
                                    </ul>
                                </li>
                           </ul>
                        </li>
                        <li><a href="#">services</a></li>
                        <li><a href="#">contacts</a></li>
                    </ul>
                </nav>
            </div>
        </div>
        <div class="row">
            <div class="img-bg">
                <img src="/templates/food-broker/images/img-bg.png" alt="">
                <div class="abs-1">
                    <div class="text-2">Develop your<br> business in consumer<br> packaged goods </div>
                    <span></span>
                </div>
                <div class="abs-2">
                    <div class="text-2">Enter new<br> distribution<br> channels </div>
                    <span></span>
                </div>
                <div class="abs-3">
                    <div class="text-2">Ensure that your <br> products are listed or <br> launch a new brand </div>
                    <span></span>
                </div>
                <div class="abs-4">
                    <div class="text-2">Have more <br> impact on <br>seasonal <br>markets</div>
                    <span></span>
                </div>
                <div class="abs-5">
                    <div class="text-2">Support or turn <br>around your <br>product sales</div>
                    <span></span>
                </div>
            </div>
        </div>
    </div>
</header>

<!--=======content================================-->
<section class="content">
    <div class="container_12">
        <div class="row">
            <div class="grid_12 block-1">
                <h2>our products:</h2>
                <div class="list_carousel responsive"> 
                    <div class="arrows clearfix">               
                        <a id="prev1" class="prev" href="#"></a>
                        <a id="next1" class="next" href="#"></a>
                    </div> 
                    <ul id="foo" class="clearfix">{{PRODUCTS}}</ul>
                </div>
            </div>
        </div>
        <div class="grid_12">
            <div class="bord-1"></div>
        </div>
        <div class="row">
            <div class="grid_4">
                <h2>benefits:</h2>
                <ol class="list">
                    <li><a href="#">Praesent vestibulum aenean </a></li>
                    <li><a href="#">Cum sociis natoque penatibus et</a></li>
                    <li><a href="#">Montes ascetur ridiculus mus</a></li>
                    <li><a href="#">Fusce feugiat malesuada odio</a></li>
                    <li><a href="#">Morbi nunc odio gravida at cursus </a></li>
                    <li><a href="#">Maecenas tristique orci ac sem</a></li>
                </ol>
            </div>
            <div class="grid_5">
                <h2>welcome!</h2>
                <div class="grid_inside">
                    <div class="grid_3">
                        <div>Praesent vestibulum aenean nonummy hendrerit mauris. Cum sociis natoque penatibus et magnis dis parturient montes ascetur ridiculus mus. Nulla dui. Fusce feugiat malesuada odio.</div> 
                        <a href="#" class="link">read more</a>
                    </div>
                    <div class="grid_2">
                        <div class="text-1">Praesent vestibulum aenean nonummy hendrerit mauris. Cum sociis natoque penatibus et magnis dis parturient.</div>
                    </div>
                </div>
            </div>
            <div class="grid_3">
                <div class="box-1">
                    <div class="text-3">
                        CALL US:
                        <div class="text-4">1 800 123 1234</div>
                        USA – austin, 901 EASTE 
                        STREET, texas, CA 90744 <br>
                        e-mail: <a href="#" class="underline">mail@demolink.org</a>
                    </div>
                </div>
            </div>
            <div class="grid_12">
                <div class="bord-2"></div>
            </div>
            <ul class="list_logos clearfix">
                <li><a href="#"><img src="/templates/food-broker/images/logo-1.png" alt=""></a></li>
                <li><a href="#"><img src="/templates/food-broker/images/logo-2.png" alt=""></a></li>
                <li><a href="#"><img src="/templates/food-broker/images/logo-3.png" alt=""></a></li>
                <li><a href="#"><img src="/templates/food-broker/images/logo-4.png" alt=""></a></li>
                <li><a href="#"><img src="/templates/food-broker/images/logo-5.png" alt=""></a></li>
                <li><a href="#"><img src="/templates/food-broker/images/logo-6.png" alt=""></a></li>
                <li><a href="#"><img src="/templates/food-broker/images/logo-7.png" alt=""></a></li>
            </ul>
        </div>
    </div>
</section>

<!--=======footer=================================-->

<footer>
    <div class="container_12">
        <div class="grid_3 fright">
            <ul class="f-list">
                <li><a href="#">Management by objective</a></li>
                <li><a href="#">Store resets</a></li>
                <li><a href="#">Commodity sales</a></li>
            </ul>
        </div>
        <div class="grid_3 fright">
            <ul class="f-list">
                <li><a href="#">Merchandising</a></li>
                <li><a href="#">Association affiliation</a></li>
                <li><a href="#">Order fulfillment</a></li>
                <li><a href="#">Continuity coverage</a></li>
                <li><a href="#">Proactive Sales Planning</a></li>
                <li><a href="#">Customer Service</a></li>
            </ul>
        </div>
        <div class="grid_3 fright">
            <ul class="f-list">
                <li><a href="#">New product presentations</a></li>
                <li><a href="#">Conduct sales meetings</a></li>
                <li><a href="#">Follow up on leads</a></li>
                <li><a href="#">Food show participation</a></li>
                <li><a href="#">Monitor growth</a></li>
                <li><a href="#">Marketing support</a></li>
            </ul>
        </div>
        <div class="grid_3 fleft">
            <a href="#" class="logo"><img src="/templates/food-broker/images/f-logo.png" alt=""></a>
            <div class="copyright">
                &copy; <span id="copyright-year"></span> 
                <div><a href="#" class="h-underline">Privacy Policy</a></div>
                <!--{%FOOTER_LINK} -->
            </div>
        </div>
    </div>
</footer>

</body>
</html>`;

export default {
  id: 'food-broker',
  name: 'Food Broker',
  storeType: 'food' as const,
  description: 'Vintage food brokerage template — style classique food industry',
  preview: '',
  theme: {
    fontFamily: "'Patrick Hand SC', 'Georgia', serif",
    bgColor: '#f5f0e8',
    surfaceColor: '#ffffff',
    textColor: '#3d2e1e',
    accentColor: '#8b3a2a',
    glowColor: '#8b3a2a',
    glowEnabled: false,
    animationEnabled: false,
    glassEnabled: false,
  },
  html,
};
