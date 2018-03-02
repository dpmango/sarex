$(document).ready(function(){

  //////////
  // Global variables
  //////////

  var _window = $(window);
  var _document = $(document);

  ////////////
  // READY - triggered when PJAX DONE
  ////////////
  function pageReady(){

    legacySupport();
    initHeaderScroll();
    pagination();
    _window.on('scroll', throttle(pagination, 50));
    _window.on('resize', debounce(pagination, 250));
    checkNavHash();

    initPopups();
    initSliders();
    initScrollMonitor();
    initMasks();

    // $(window).scrollTop(1);
    $(window).scroll();
    $(window).resize();
  }

  // this is a master function which should have all functionality
  pageReady();

  //////////
  // COMMON
  //////////

  function legacySupport(){
    // svg support for laggy browsers
    svg4everybody();

    // Viewport units buggyfill
    window.viewportUnitsBuggyfill.init({
      force: false,
      refreshDebounceWait: 150,
      appendToBody: true
    });
  }


  // Prevent # behavior
	_document
    .on('click', '[href="#"]', function(e) {
  		e.preventDefault();
  	})

  // HEADER SCROLL
  // add .header-static for .page or body
  // to disable sticky header
  function initHeaderScroll(){
    _window.on('scroll', throttle(function(e) {
      var vScroll = _window.scrollTop();
      var header = $('.header').not('.header--static');
      var headerHeight = header.height();
      var firstSection = _document.find('.hero').height() - headerHeight;
      var visibleWhen = Math.round(_document.height() / _window.height()) >  2.5

      if (visibleWhen){
        if ( vScroll > headerHeight ){
          header.addClass('is-fixed');
        } else {
          header.removeClass('is-fixed');
        }
        if ( vScroll > firstSection ){
          header.addClass('is-fixed-visible');
        } else {
          header.removeClass('is-fixed-visible');
        }
      }
    }, 10));
  }

  var preventKeys = {
    37: 1, 38: 1, 39: 1, 40: 1
  };

  function preventDefault(e) {
    e = e || window.event;
    if (e.preventDefault)
      e.preventDefault();
    e.returnValue = false;
  }

  function preventDefaultForScrollKeys(e) {
    if (preventKeys[e.keyCode]) {
      preventDefault(e);
      return false;
    }
  }

  function disableScroll() {
    var target = window
    if (window.addEventListener) // older FF
      target.addEventListener('DOMMouseScroll', preventDefault, false);
    target.onwheel = preventDefault; // modern standard
    target.onmousewheel = target.onmousewheel = preventDefault; // older browsers, IE
    target.ontouchmove = preventDefault; // mobile
    target.onkeydown = preventDefaultForScrollKeys;
  }
  function enableScroll() {
    var target = window
    if (window.removeEventListener)
      target.removeEventListener('DOMMouseScroll', preventDefault, false);
    target.onmousewheel = target.onmousewheel = null;
    target.onwheel = null;
    target.ontouchmove = null;
    target.onkeydown = null;
  }

  function blockScroll(unlock) {
    if ($('.mobile-navi').is('.is-active')) {
      disableScroll();
    } else {
      enableScroll();
    }

    if (unlock) {
      enableScroll();
    }
  };

  function bindOverflowScroll(){
    var $menuLayer = $(".mobile-navi");
    $menuLayer.bind('touchstart', function (ev) {
        var $this = $(this);
        var layer = $menuLayer.get(0);

        if ($this.scrollTop() === 0) $this.scrollTop(1);
        var scrollTop = layer.scrollTop;
        var scrollHeight = layer.scrollHeight;
        var offsetHeight = layer.offsetHeight;
        var contentHeight = scrollHeight - offsetHeight;
        if (contentHeight == scrollTop) $this.scrollTop(scrollTop-1);
    });
  }
  // bindOverflowScroll();

  // HAMBURGER TOGGLER
  _document.on('click', '[js-hamburger]', function(){
    $(this).toggleClass('is-active');
    $('.header').toggleClass('is-black')
    $('.mobile-navi').toggleClass('is-active');
    blockScroll();
  });

  function closeMobileMenu(){
    blockScroll(true);
    $('[js-hamburger]').removeClass('is-active');
    $('.header').removeClass('is-black')
    $('.mobile-navi').removeClass('is-active');
  }

  // SET ACTIVE CLASS IN HEADER
  // * could be removed in production and server side rendering when header is inside barba-container
  function updateHeaderActiveClass(){
    $('.header__menu li').each(function(i,val){
      if ( $(val).find('a').attr('href') == window.location.pathname.split('/').pop() ){
        $(val).addClass('is-active');
      } else {
        $(val).removeClass('is-active')
      }
    });
  }

  //////////
  // PAGINATION
  //////////

  function pagination(){
    // Cache selectors
    var paginationAnchors = $(".pagination").find(".pagination__el");
    var sections = $('.hero, .page__scroller [data-section]');
    var headerHeight = $('.header').height();
    var vScroll = _window.scrollTop();

    // Get id of current scroll item
    var cur = sections.map(function(){
     if ($(this).offset().top < vScroll + (headerHeight / 2))
       return this;
    });
    // Get current element
    cur = $(cur[cur.length-1]);
    var id = cur && cur.length ? cur.data('section') : "1";
    var headerClass = cur && cur.length ? cur.data('header') : ""

    // update hash
    setTimeout(function(){
      window.location.hash = id
    },1000)

    // Set/remove active class
    paginationAnchors.removeClass("is-active").filter("[data-section='"+id+"']").addClass("is-active");

    // set header color
    if ( headerClass ){
      $('.header').addClass('is-white-scroll')
      $('.pagination').removeClass('is-dark')
    } else{
      $('.header').removeClass('is-white-scroll')
      $('.pagination').addClass('is-dark')
    }
    if (id == "1"){
      $('.pagination').removeClass('is-dark')
    }

  }

  // click to navigate
  _document
    .on('click', '.pagination__el, [js-scrollTo]', function(){
      var selectedId = $(this).data('section') !== undefined ? $(this).data('section') : $(this).data('section-to');
      var cur = $('.hero, .page__scroller [data-section]').filter(function(){
       if ($(this).data('section') == selectedId){return this};
      });
      var targetScroll = $(cur).data('section') == "1" ? 0 : $(cur).offset().top
      closeMobileMenu();

      $('body, html').animate({
          scrollTop: getTargetSectionOffset(targetScroll)}, 1000);
      return false;
    })

  function checkNavHash(){
    if ( window.location.hash ){
      var targetSectionId = window.location.hash.substring(1,2)
      if ( targetSectionId > 1 ){
        var targetScroll = $('.page__scroller [data-section='+targetSectionId+']').offset().top

        $('body, html').animate({
            scrollTop: getTargetSectionOffset(targetScroll)}, 100);
      }
    }
  }

  function getTargetSectionOffset(sectionOffset){
    var target = sectionOffset
    // if ( _window.width() < 768 ){
    //   target = target - $('.header').height()
    // }
    target = target - $('.header').height()
    return target
  }

  //////////
  // SLIDERS
  //////////

  function initSliders(){
    $('[js-testimonialsSlider]').slick({
      autoplay: true,
      autoplaySpeed: 5000,
      dots: true,
      arrows: false,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      // vertical: true,
      accessibility: false,
      adaptiveHeight: true
    })


    var mySwiper = new Swiper('.logos', {
      wrapperClass: 'logos__wrapper',
      slideClass: 'logos__img',
      watchOverflow: true,
      // spaceBetween: 6,
      slidesPerView: 'auto',
      // centeredSlides: true,
      // freeMode: true,
      // loop: true,
      pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
      },
    });

    // var _logosSlickMobile = $('.logos__wrapper');
    // var logosSlickMobileOptions = {
    //   mobileFirst: true,
    //   dots: true,
    //   arrows: false,
    //   variableWidth: true,
    //   centerMode: true,
    //   responsive: [
    //     {
    //       breakpoint: 768,
    //       settings: "unslick"
    //     }
    //   ]
    // }
    // _logosSlickMobile.slick(logosSlickMobileOptions);
    //
    // _window.on('resize', debounce(function(e){
    //   if ( _window.width() > 768 ) {
    //     if (_logosSlickMobile.hasClass('slick-initialized')) {
    //       _logosSlickMobile.slick('unslick');
    //     }
    //     return
    //   }
    //   if (!_logosSlickMobile.hasClass('slick-initialized')) {
    //     return _logosSlickMobile.slick(logosSlickMobileOptions);
    //   }
    // }, 300));

    // prices
    var _priceSlickMobile = $('.prices__wrapper');
    var priceSlickMobileOptions = {
      mobileFirst: true,
      dots: true,
      arrows: false,
      variableWidth: true,
      centerMode: true,
      initialSlide: 1,
      responsive: [
        {
          breakpoint: 992,
          settings: "unslick"
        }
      ]
    }
    _priceSlickMobile.slick(priceSlickMobileOptions);

    _window.on('resize', debounce(function(e){
      if ( _window.width() > 992 ) {
        if (_priceSlickMobile.hasClass('slick-initialized')) {
          _priceSlickMobile.slick('unslick');
        }
        return
      }
      if (!_priceSlickMobile.hasClass('slick-initialized')) {
        return _priceSlickMobile.slick(priceSlickMobileOptions);
      }
    }, 300));

  }

  //////////
  // MODALS
  //////////

  function initPopups(){
    // Magnific Popup
    // var startWindowScroll = 0;
    $('[js-popup]').magnificPopup({
      type: 'inline',
      fixedContentPos: true,
      fixedBgPos: true,
      overflowY: 'auto',
      closeBtnInside: true,
      preloader: false,
      midClick: true,
      removalDelay: 300,
      mainClass: 'popup-buble'
    });


    $('[js-popupVideo]').magnificPopup({
      // disableOn: 700,
      type: 'iframe',
      fixedContentPos: true,
      fixedBgPos: true,
      overflowY: 'auto',
      closeBtnInside: true,
      preloader: false,
      midClick: true,
      removalDelay: 300,
      mainClass: 'popup-buble',
      callbacks: {
        beforeOpen: function() {
          // startWindowScroll = _window.scrollTop();
          // $('html').addClass('mfp-helper');
        }
      },
      patterns: {
        youtube: {
          index: 'youtube.com/',
          id: 'v=', // String that splits URL in a two parts, second part should be %id%
          src: '//www.youtube.com/embed/%id%?autoplay=1&controls=0&showinfo=0' // URL that will be set as a source for iframe.
        }
      },
    });


  }

  function closeMfp(){
    $.magnificPopup.close();
  }

  ////////////
  // UI
  ////////////

  $('input[name="time"]').each(function(i,input){
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();

    $(input).val(h + ":" + m)
  })
  // focus in
  _document.on('focus', '.ui-input', function(){
    $(this).addClass('is-focused');
  })

  // focus out
  _document.on('blur', '.ui-input', function(){
    var thisVal = $(this).find('input, textarea').val();
    if ( thisVal !== "" ){
      $(this).addClass('is-focused');
    } else {
      $(this).removeClass('is-focused');
    }
  })


  // Masked input
  function initMasks(){
    // $("input[name='time']").mask("00:00",{placeholder:"12:00"});
    $("input[name='time']").mask('AB:CD', {
		translation: {
			A: { pattern: /[0-2]/ },
			B: { pattern: /[0-9]/ },
			C: { pattern: /[0-6]/ },
			D: { pattern: /[0-9]/ }
		},
		onKeyPress: function(a, b, c, d) {
			if (!a) return;
			let m = a.match(/(\d{1})/g);
			if (!m) return;
			if (parseInt(m[0]) === 3) {
				d.translation.B.pattern = /[0-1]/;
			} else {
				d.translation.B.pattern = /[0-9]/;
			}
			if (parseInt(m[2]) == 1) {
				d.translation.D.pattern = /[0-2]/;
			} else {
				d.translation.D.pattern = /[0-9]/;
			}
			let temp_value = c.val();
			c.val('');
			c.unmask().mask('AB:CD', d);
			c.val(temp_value);
		}
	})
	.keyup();

    $("input[type='tel']").mask("+7 (000) 000-0000", {placeholder: "+7 (___) ___-____"});
  }


  ////////////
  // SCROLLMONITOR - WOW LIKE
  ////////////
  function initScrollMonitor(){
    $('.wow').each(function(i, el){

      var elWatcher = scrollMonitor.create( $(el) );

      var delay;
      if ( $(window).width() < 768 ){
        delay = 0
      } else {
        delay = $(el).data('animation-delay');
      }

      var animationClass = $(el).data('animation-class') || "wowFadeUp"

      var animationName = $(el).data('animation-name') || "wowFade"

      elWatcher.enterViewport(throttle(function() {
        $(el).addClass(animationClass);
        $(el).css({
          'animation-name': animationName,
          'animation-delay': delay,
          'visibility': 'visible'
        });
      }, 100, {
        'leading': true
      }));
      // elWatcher.exitViewport(throttle(function() {
      //   $(el).removeClass(animationClass);
      //   $(el).css({
      //     'animation-name': 'none',
      //     'animation-delay': 0,
      //     'visibility': 'hidden'
      //   });
      // }, 100));
    });

  }

});


//////////////
// CONTACT SECTION
/////////////

// When the window has finished loading create our google map below
if ( $('#contact-map').length > 0 ){
  google.maps.event.addDomListener(window, 'load', init);
}

function init() {

    // map
    var mapOptions = {
        zoom: 9,
        center: new google.maps.LatLng(55.655826, 37.617300),
        styles: [{"featureType":"water","elementType":"geometry","stylers":[{"color":"#e9e9e9"},{"lightness":17}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffffff"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#ffffff"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":16}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":21}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#dedede"},{"lightness":21}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#ffffff"},{"lightness":16}]},{"elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#333333"},{"lightness":40}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#f2f2f2"},{"lightness":19}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#fefefe"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#fefefe"},{"lightness":17},{"weight":1.2}]}]
    };

    // Get the HTML DOM element that will contain your map
    // We are using a div with id="map" seen below in the <body>
    var mapElement = document.getElementById('contact-map');

    var map = new google.maps.Map(mapElement, mapOptions);

    // markers
    // var locations = [
    //   {lat: -31.563910, lng: 147.154312},
    //   {lat: -33.718234, lng: 150.363181},
    // ]
    var locations = [
      "Москва, Красная площадь",
      "Дорохово, Московская область",
      "Подкопаевский пер., 4с7, Москва, 109028",
      "Центральный административный округ, Тверской район",
      "Съезжинский переулок, Москва",
      "улица Варварка, 6с3, Москва",
      "Большой Спасоглинищевский переулок, 12/3",
      "Моховая улица, 11с1",
      "Землянной вал 11, Москва",
      "Ходныский бульвар 13",
      "Стадион лужники",
      "метро полежаевская"
    ]
    var geocodedLocations = [];

    // geocoder for markers
    var geocoder = new google.maps.Geocoder();
    var markers = locations.map(function(adress, i) {
      geocoder.geocode({ 'address': adress
      }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          geocodedLocations.push({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          });
        }
        if ( i = locations[locations.length - 1] ){
          addMarkers();
        }
      });
    });

    var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    function addMarkers(){
      var markers = geocodedLocations.map(function(location, i) {
        return new google.maps.Marker({
          position: location,
          icon: '/img/mapsMarker1.png'
          // label: labels[i % labels.length]
        });
      });

      var clusterOptions = {
        // imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
        imagePath: '/img/mapsMarker',
        styles:[
          {
            url: '/img/mapsMarker1.png',
            height: 63,
            width: 31,
            // backgroundPosition: [0, 0],
            anchor: [10,0],
            textColor: "#FFF",
            textSize: 13

          },
          {
            url: '/img/mapsMarker2.png',
            height: 75,
            width: 53,
            // backgroundPosition: "10px",
            anchor: [20,0],
            textColor: "#FFF",
            textSize: 13
          }
        ]
      }
      var markerCluster = new MarkerClusterer(map, markers, clusterOptions);
    }

    // var icon = 'img/mapsMarker.png';
    //
    // var marker = new google.maps.Marker({
    //     position: new google.maps.LatLng(55.546167, 37.575505),
    //     icon: icon,
    //     map: map,
    //     title: 'Офис и производство'
    // });

    // var contentString = '<div class="g-marker">'+
    //     '<p><b>Офис и производство</b>Синельниковская ул., 12</p>'+
    //     '</div>';
    //
    // var infowindow = new google.maps.InfoWindow({
    //   content: contentString
    // });

    // marker.addListener('click', function() {
    //   infowindow.open(map, marker);
    // });

    // google.maps.event.addListener(map, 'click', function() {
    //   infowindow.close();
    // });

    // INFOWINDOW CUSTOMIZE.
    // google.maps.event.addListener(infowindow, 'domready', function() {
    //
    //   var iwOuter = $('.gm-style-iw');
    //   var iwBackground = iwOuter.prev();
    //   iwBackground.children(':nth-child(2)').css({'display' : 'none'});
    //   iwBackground.children(':nth-child(4)').css({'display' : 'none'});
    //
    //   // set dialog pos
    //   iwOuter.parent().parent().css({left: '-70px', top: '38px'});
    //
    //   // remove arrow
    //   iwBackground.children(':nth-child(1)').attr('style', function(i,s){ return s + 'left: 10000px !important;'});
    //   iwBackground.children(':nth-child(3)').attr('style', function(i,s){ return s + 'left: 10000px !important;'});
    //
    //   iwBackground.children(':nth-child(3)').find('div').children().css({'box-shadow': 'none', 'z-index' : '-100'});
    //   iwBackground.children(':nth-child(3)').find('div').children().css({'display': 'none'});
    //
    //   //remove close btn
    //   var iwCloseBtn = iwOuter.next();
    //   iwCloseBtn.css({display: 'none'});
    //   $('.iw-bottom-gradient').css({display: 'none'});
    //
    // });

};
