import { translateHTML } from '@/lib/i18n/translate-html';
import type { Locale } from '@/lib/i18n/config';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const rawHTML = `
  <div class="page_wrap">
    <div bind="629953f2-2eb7-b8cd-2de1-3a2b72becc90" class="w-embed">
      <style>
.page_wrap {
	overflow: clip;
  }
.slider-main_overflow {
	width: calc(100% + 100vw);
  }
  .slider-main_overflow > div {
	width: calc(100% - 100vw);
  }
      .is-disabled, .swiper-button-disabled {
      visibility: hidden;
      opacity: 0;
      display: none;
      transition: 0.5s ease-in-out;
    }
    .swiper-button-next, .swiper-button-prev {
      opacity: 1;
      transition: 0.5s ease-in-out;
    }
  </style>
      <style>
@media screen and (min-width: 768px) {
  [item-style=tall] {
  grid-row-start: span 2;
  grid-row-end: span 2;
  grid-column-start: span 1;
  grid-column-end: span 1;
  }
  [item-style=wide] {
  grid-row-start: span 1;
  grid-row-end: span 1;
  grid-column-start: span 1;
  grid-column-end: span 1;
  }
}
</style>
    </div>
    <div bind="4bc36725-f958-4612-d2cb-e90fd749ba6b" data-animation="default" data-collapse="medium" data-duration="400" data-easing="ease" data-easing2="ease" role="banner" class="nav-stonearts w-nav">
      <div class="desktop-nav">
        <div class="container-menu">
          <div class="nav-left">
            <nav role="navigation" class="nav-menu w-nav-menu">
              <div data-hover="true" data-delay="300" bind="4bc36725-f958-4612-d2cb-e90fd749ba70" data-w-id="4bc36725-f958-4612-d2cb-e90fd749ba70" class="dropdown-2 w-dropdown">
                <div class="dropdown-toggle-5 w-dropdown-toggle">
                  <div bind="4bc36725-f958-4612-d2cb-e90fd749ba72" class="arrow-class w-icon-dropdown-toggle"></div>
                  <div class="text-block-58">Shop</div>
                </div>
                <nav class="dropdown-list-2 w-dropdown-list">
                  <div class="general-mega-wrapper">
                    <div class="mega-menu-container">
                      <div class="w-layout-grid mega-menu-grid">
                        <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749ba79-d749ba6b" class="mega-menu-block links">
                          <div class="link-wrapper">
                            <a product-link="Yami" href="/product/whisper" class="mega-menu-linkblock w-inline-block">
                              <h5 class="heading-206 inspiration">Akurock Akustikpaneele</h5>
                            </a>
                            <a href="/akurock-muster" class="mega-menu-linkblock w-inline-block">
                              <h5 class="heading-206 inspiration">Musterbox</h5>
                            </a>
                            <a href="/zubehoer" class="mega-menu-linkblock w-inline-block">
                              <h5 class="heading-206 inspiration">Zubehör</h5>
                            </a>
                            <a href="/visualizer" class="mega-menu-linkblock w-inline-block">
                              <h5 class="heading-206 inspiration">Visualizer</h5>
                            </a>
                            <a href="/installation-and-guide" class="mega-menu-linkblock w-inline-block">
                              <h5 class="heading-206 inspiration">Installationsguide</h5>
                            </a>
                            <a href="/akustik" class="mega-menu-linkblock w-inline-block">
                              <h5 class="heading-206 inspiration">Wie funktioniert ein Akustikpaneel?</h5>
                            </a>
                          </div>
                        </div>
                        <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749ba87-d749ba6b" class="mega-menu-block img-large">
                          <a product-link="Ligia" data-w-id="4bc36725-f958-4612-d2cb-e90fd749ba88" href="/product/whisper" class="img-container-menu w-inline-block">
                            <div class="heade-wrapper-mega-menu">
                              <h4 class="heading-207 img">Highlight</h4>
                            </div>
                            <div class="img-wrapper-menu div-block-666 div-block-667 div-block-668"></div>
                            <div class="text-wrapper-menu">
                              <div class="bottom-mega-text-wrapper">
                                <div class="text-block-57">Akurock Paneele</div><img src="/images/Arrow-Right-Black---Mega--Menu.svg" loading="lazy" width="12" alt="" class="image-117">
                              </div>
                              <h4 class="heading-208">Erschaffen mühelos eine moderne Oase.</h4>
                            </div>
                          </a>
                        </div>
                        <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749ba94-d749ba6b" class="mega-menu-block img-large _2">
                          <a data-w-id="4bc36725-f958-4612-d2cb-e90fd749ba95" href="/akurock-muster" class="img-container-menu w-inline-block">
                            <div class="heade-wrapper-mega-menu">
                              <h4 class="heading-207 img">Nimm es in die Hand!</h4>
                            </div>
                            <div class="img-wrapper-menu div-block-666 div-block-667 div-block-668 _2"></div>
                            <div class="text-wrapper-menu">
                              <div class="bottom-mega-text-wrapper">
                                <div class="text-block-57">Musterbox</div><img src="/images/Arrow-Right-Black---Mega--Menu.svg" loading="lazy" width="12" alt="" class="image-117">
                              </div>
                              <h4 class="heading-208">Fühle und sehe es selbst.</h4>
                            </div>
                          </a>
                        </div>
                        <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749baa1-d749ba6b" class="mega-menu-block img-large">
                          <a data-w-id="4bc36725-f958-4612-d2cb-e90fd749baa2" href="/visualizer" class="img-container-menu w-inline-block">
                            <div class="heade-wrapper-mega-menu">
                              <h4 class="heading-207 img">Probiere es an deiner Wand!</h4>
                            </div>
                            <div class="img-wrapper-menu div-block-666 div-block-667 div-block-668 _3"></div>
                            <div class="text-wrapper-menu">
                              <div class="bottom-mega-text-wrapper">
                                <div class="text-block-57">Visualizer</div><img src="/images/Arrow-Right-Black---Mega--Menu.svg" loading="lazy" width="12" alt="" class="image-117">
                              </div>
                              <h4 class="heading-208">Schau dir AKUROCK vorab an deiner Wand an.</h4>
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div class="footer-mega-menu">
                      <div class="text-block-56">Let's move mountains.</div>
                    </div>
                  </div>
                </nav>
              </div>
              <div data-hover="true" data-delay="300" bind="4bc36725-f958-4612-d2cb-e90fd749bab1" data-w-id="4bc36725-f958-4612-d2cb-e90fd749bab1" class="dropdown-2 inspiration w-dropdown">
                <div class="dropdown-toggle-5 w-dropdown-toggle">
                  <div bind="4bc36725-f958-4612-d2cb-e90fd749bab3" class="arrow-class w-icon-dropdown-toggle"></div>
                  <div class="text-block-58 inspiration">Inspiration</div>
                </div>
                <nav class="dropdown-list-2 w-dropdown-list">
                  <div class="general-mega-wrapper">
                    <div class="mega-menu-container">
                      <div class="w-layout-grid mega-menu-grid inspiration">
                        <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749baba-d749ba6b" class="mega-menu-block links">
                          <div class="link-wrapper">
                            <a href="/galerie" class="mega-menu-linkblock w-inline-block">
                              <h5 class="heading-206 inspiration">Galerie</h5>
                            </a>
                            <a href="/stein-selektion" class="mega-menu-linkblock w-inline-block">
                              <h5 class="heading-206 inspiration">Unsere Steine</h5>
                            </a>
                            <a href="/stoneskin" class="mega-menu-linkblock w-inline-block">
                              <h5 class="heading-206 inspiration">Stoneskin</h5>
                            </a>
                            <a href="/blog-news" class="mega-menu-linkblock w-inline-block">
                              <h5 class="heading-206 inspiration">Unser Journal</h5>
                            </a>
                            <a href="/visualizer" class="mega-menu-linkblock w-inline-block">
                              <h5 class="heading-206 inspiration">Visualizer</h5>
                            </a>
                          </div>
                        </div>
                        <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749bac5-d749ba6b" class="mega-menu-block img-large">
                          <a data-w-id="4bc36725-f958-4612-d2cb-e90fd749bac6" href="/stein-selektion" class="img-container-menu w-inline-block">
                            <div class="heade-wrapper-mega-menu">
                              <h4 class="heading-207 img">Lass dich inspirieren!</h4>
                            </div>
                            <div class="img-wrapper-menu div-block-666 div-block-667 div-block-668 inspiration"></div>
                            <div class="text-wrapper-menu">
                              <div class="bottom-mega-text-wrapper">
                                <div class="text-block-57">Die Seele der Natur</div><img src="/images/Arrow-Right-Black---Mega--Menu.svg" loading="lazy" width="12" alt="" class="image-117">
                              </div>
                              <h4 class="heading-208">Berührt von den Elementen durch Jahrtausende.</h4>
                            </div>
                          </a>
                        </div>
                        <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749bad2-d749ba6b" class="mega-menu-block img-large _2">
                          <a data-w-id="4bc36725-f958-4612-d2cb-e90fd749bad3" href="/stoneskin" class="img-container-menu w-inline-block">
                            <div class="heade-wrapper-mega-menu">
                              <h4 class="heading-207 img">Naturstein</h4>
                            </div>
                            <div class="img-wrapper-menu div-block-666 div-block-667 div-block-668 _2 inspiration second"></div>
                            <div class="text-wrapper-menu">
                              <div class="bottom-mega-text-wrapper">
                                <div class="text-block-57">Stoneskin</div><img src="/images/Arrow-Right-Black---Mega--Menu.svg" loading="lazy" width="12" alt="" class="image-117">
                              </div>
                              <h4 class="heading-208">Millionen Jahre auf einem dünnen Blatt.</h4>
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div class="footer-mega-menu">
                      <div class="text-block-56">We move mountains.</div>
                    </div>
                  </div>
                </nav>
              </div>
              <div data-hover="true" data-delay="300" bind="4bc36725-f958-4612-d2cb-e90fd749bae2" data-w-id="4bc36725-f958-4612-d2cb-e90fd749bae2" class="dropdown-2 support w-dropdown">
                <div class="dropdown-toggle-5 w-dropdown-toggle">
                  <div bind="4bc36725-f958-4612-d2cb-e90fd749bae4" class="arrow-class w-icon-dropdown-toggle"></div>
                  <div class="text-block-58">Kundenservice</div>
                </div>
                <nav class="dropdown-list-2 w-dropdown-list">
                  <div class="general-mega-wrapper">
                    <div class="mega-menu-container">
                      <div class="w-layout-grid mega-menu-grid support">
                        <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749baeb-d749ba6b" class="mega-menu-block links">
                          <div class="link-wrapper">
                            <a href="/faq" class="mega-menu-linkblock w-inline-block">
                              <h5 class="heading-206 inspiration">Brauchst du Hilfe?</h5>
                            </a>
                            <a href="/faq" class="mega-menu-linkblock w-inline-block">
                              <h5 class="heading-206 inspiration">FAQs</h5>
                            </a>
                            <a href="/kontaktier-uns" class="mega-menu-linkblock w-inline-block">
                              <h5 class="heading-206 inspiration">Kontaktiere uns</h5>
                            </a>
                          </div>
                        </div>
                        <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749baf6-d749ba6b" class="mega-menu-block img-large">
                          <a data-w-id="4bc36725-f958-4612-d2cb-e90fd749baf7" href="/installation-and-guide" class="img-container-menu w-inline-block">
                            <div class="heade-wrapper-mega-menu">
                              <h4 class="heading-207 img">Wie installiere ich AKUROCK?</h4>
                            </div>
                            <div class="img-wrapper-menu div-block-666 div-block-667 div-block-668 installation"></div>
                            <div class="text-wrapper-menu">
                              <div class="bottom-mega-text-wrapper">
                                <div class="text-block-57">Installationsguide</div><img src="/images/Arrow-Right-Black---Mega--Menu.svg" loading="lazy" width="12" alt="" class="image-117">
                              </div>
                              <h4 class="heading-208">Schritt-für-Schritt-Anleitung für die mühelose Umgestaltung deines Raumes.</h4>
                            </div>
                          </a>
                        </div>
                        <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749bb03-d749ba6b" class="mega-menu-block img-large _2">
                          <a data-w-id="4bc36725-f958-4612-d2cb-e90fd749bb04" href="/kontaktier-uns" class="img-container-menu w-inline-block">
                            <div class="heade-wrapper-mega-menu">
                              <h4 class="heading-207 img">Hast du Fragen?</h4>
                            </div>
                            <div class="img-wrapper-menu div-block-666 div-block-667 div-block-668 _2 support"></div>
                            <div class="text-wrapper-menu">
                              <div class="bottom-mega-text-wrapper">
                                <div class="text-block-57">Wir sind für dich da</div><img src="/images/Arrow-Right-Black---Mega--Menu.svg" loading="lazy" width="12" alt="" class="image-117">
                              </div>
                              <h4 class="heading-208">Bereit, deinen Raum in ein Meisterwerk zu verwandeln? Teile deine Vision mit uns und lasse uns diese gemeinsam verwirklichen!</h4>
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div class="footer-mega-menu">
                      <div class="text-block-56">Let's move mountains.</div>
                    </div>
                  </div>
                </nav>
              </div>
            </nav>
          </div>
          <div class="nav-center">
            <a href="/" aria-current="page" class="nav-logo-link w-inline-block w--current"><img src="/images/stonearts®-logo-black-long.svg" loading="lazy" alt="" class="logo-stonearts"></a>
          </div>
          <div class="nav-right">
            <nav role="navigation" class="nav-menu _2 w-nav-menu">
              <a href="/uber-uns" class="link-block-17 w-inline-block">
                <div class="text-block-59">Über uns</div>
              </a>
              <a href="/verantwortung" class="link-block-17 w-inline-block">
                <div class="text-block-59">Verantwortung</div>
              </a>
              <a href="#" class="link-block-17 contact-us w-inline-block">
                <div class="text-block-59">CONTACT US</div>
              </a>
            </nav>
            <div class="button-wrapper-menu div-block-663 div-block-664 div-block-665">
              <div class="account-wrapper"><img src="/images/person-outline-2.svg" loading="lazy" alt="" class="image-121"></div>
              <div bind="4bc36725-f958-4612-d2cb-e90fd749bb24" data-open-product="" data-wf-cart-type="rightSidebar" data-wf-cart-query="" data-wf-page-link-href-prefix="" class="w-commerce-commercecartwrapper cart" data-node-type="commerce-cart-wrapper">
                <a bind="4bc36725-f958-4612-d2cb-e90fd749bb25" class="w-commerce-commercecartopenlink cart-button-3 w-inline-block" role="button" aria-haspopup="dialog" aria-label="Open cart" data-node-type="commerce-cart-open-link" href="#">
                  <div bind="4bc36725-f958-4612-d2cb-e90fd749bb26" class="w-commerce-commercecartopenlinkcount cart-quantity-3">0</div><img src="/images/bag-outline.svg" loading="lazy" alt="" class="image-122">
                </a>
                <div bind="4bc36725-f958-4612-d2cb-e90fd749bb28" style="display:none" class="w-commerce-commercecartcontainerwrapper w-commerce-commercecartcontainerwrapper--cartType-rightSidebar" data-node-type="commerce-cart-container-wrapper">
                  <div bind="4bc36725-f958-4612-d2cb-e90fd749bb29" data-node-type="commerce-cart-container" role="dialog" class="w-commerce-commercecartcontainer cart-container-2">
                    <div bind="4bc36725-f958-4612-d2cb-e90fd749bb2a" class="w-commerce-commercecartheader">
                      <h4 bind="4bc36725-f958-4612-d2cb-e90fd749bb2b" class="w-commerce-commercecartheading heading-253"><img src="/images/bag-outline.svg" alt="Shopping cart" style="width: 24px; height: 24px;" /></h4>
                      <a bind="4bc36725-f958-4612-d2cb-e90fd749bb2d" class="w-commerce-commercecartcloselink w-inline-block" role="button" aria-label="Close cart" data-node-type="commerce-cart-close-link"><svg class="icon-12" width="16px" height="16px" viewbox="0 0 16 16">
                          <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                            <g fill-rule="nonzero" fill="#333333">
                              <polygon points="6.23223305 8 0.616116524 13.6161165 2.38388348 15.3838835 8 9.76776695 13.6161165 15.3838835 15.3838835 13.6161165 9.76776695 8 15.3838835 2.38388348 13.6161165 0.616116524 8 6.23223305 2.38388348 0.616116524 0.616116524 2.38388348 6.23223305 8"></polygon>
                            </g>
                          </g>
                        </svg></a>
                    </div>
                    <div bind="4bc36725-f958-4612-d2cb-e90fd749bb2f" class="w-commerce-commercecartformwrapper">
                      <form bind="4bc36725-f958-4612-d2cb-e90fd749bb30" style="display:none" class="w-commerce-commercecartform" data-node-type="commerce-cart-form">
                        <script type="text/x-wf-template" id="wf-template-4bc36725-f958-4612-d2cb-e90fd749bb31"></script>
                        <div bind="4bc36725-f958-4612-d2cb-e90fd749bb31" template-bind="4bc36725-f958-4612-d2cb-e90fd749bb31" class="w-commerce-commercecartlist" data-wf-collection="database.commerceOrder.userItems" data-wf-template-id="wf-template-4bc36725-f958-4612-d2cb-e90fd749bb31"></div>
                        <div bind="4bc36725-f958-4612-d2cb-e90fd749bb41" class="w-commerce-commercecartfooter">
                          <div aria-atomic="true" aria-live="polite" bind="4bc36725-f958-4612-d2cb-e90fd749bb42" class="w-commerce-commercecartlineitem">
                            <div class="text-block-107">In total</div>
                            <div bind="4bc36725-f958-4612-d2cb-e90fd749bb45" class="w-commerce-commercecartordervalue text-block-124"></div>
                          </div>
                          <div bind="4bc36725-f958-4612-d2cb-e90fd749bb46">
                            <div data-node-type="commerce-cart-quick-checkout-actions" bind="4bc36725-f958-4612-d2cb-e90fd749bb47">
                              <a data-node-type="commerce-cart-apple-pay-button" role="button" aria-label="Apple Pay" aria-haspopup="dialog" style="background-image:-webkit-named-image(apple-pay-logo-white);background-size:100% 50%;background-position:50% 50%;background-repeat:no-repeat" class="w-commerce-commercecartapplepaybutton" tabindex="0">
                                <div></div>
                              </a>
                              <a data-node-type="commerce-cart-quick-checkout-button" role="button" tabindex="0" aria-haspopup="dialog" style="display:none" class="w-commerce-commercecartquickcheckoutbutton"><svg class="w-commerce-commercequickcheckoutgoogleicon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16" viewbox="0 0 16 16">
                                  <defs>
                                    <polygon id="google-mark-a" points="0 .329 3.494 .329 3.494 7.649 0 7.649"></polygon>
                                    <polygon id="google-mark-c" points=".894 0 13.169 0 13.169 6.443 .894 6.443"></polygon>
                                  </defs>
                                  <g fill="none" fill-rule="evenodd">
                                    <path fill="#4285F4" d="M10.5967,12.0469 L10.5967,14.0649 L13.1167,14.0649 C14.6047,12.6759 15.4577,10.6209 15.4577,8.1779 C15.4577,7.6339 15.4137,7.0889 15.3257,6.5559 L7.8887,6.5559 L7.8887,9.6329 L12.1507,9.6329 C11.9767,10.6119 11.4147,11.4899 10.5967,12.0469"></path>
                                    <path fill="#34A853" d="M7.8887,16 C10.0137,16 11.8107,15.289 13.1147,14.067 C13.1147,14.066 13.1157,14.065 13.1167,14.064 L10.5967,12.047 C10.5877,12.053 10.5807,12.061 10.5727,12.067 C9.8607,12.556 8.9507,12.833 7.8887,12.833 C5.8577,12.833 4.1387,11.457 3.4937,9.605 L0.8747,9.605 L0.8747,11.648 C2.2197,14.319 4.9287,16 7.8887,16"></path>
                                    <g transform="translate(0 4)">
                                      <mask id="google-mark-b" fill="#fff">
                                        <use xlink:href="#google-mark-a"></use>
                                      </mask>
                                      <path fill="#FBBC04" d="M3.4639,5.5337 C3.1369,4.5477 3.1359,3.4727 3.4609,2.4757 L3.4639,2.4777 C3.4679,2.4657 3.4749,2.4547 3.4789,2.4427 L3.4939,0.3287 L0.8939,0.3287 C0.8799,0.3577 0.8599,0.3827 0.8459,0.4117 C-0.2821,2.6667 -0.2821,5.3337 0.8459,7.5887 L0.8459,7.5997 C0.8549,7.6167 0.8659,7.6317 0.8749,7.6487 L3.4939,5.6057 C3.4849,5.5807 3.4729,5.5587 3.4639,5.5337" mask="url(#google-mark-b)"></path>
                                    </g>
                                    <mask id="google-mark-d" fill="#fff">
                                      <use xlink:href="#google-mark-c"></use>
                                    </mask>
                                    <path fill="#EA4335" d="M0.894,4.3291 L3.478,6.4431 C4.113,4.5611 5.843,3.1671 7.889,3.1671 C9.018,3.1451 10.102,3.5781 10.912,4.3671 L13.169,2.0781 C11.733,0.7231 9.85,-0.0219 7.889,0.0001 C4.941,0.0001 2.245,1.6791 0.894,4.3291" mask="url(#google-mark-d)"></path>
                                  </g>
                                </svg><svg class="w-commerce-commercequickcheckoutmicrosofticon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewbox="0 0 16 16">
                                  <g fill="none" fill-rule="evenodd">
                                    <polygon fill="#F05022" points="7 7 1 7 1 1 7 1"></polygon>
                                    <polygon fill="#7DB902" points="15 7 9 7 9 1 15 1"></polygon>
                                    <polygon fill="#00A4EE" points="7 15 1 15 1 9 7 9"></polygon>
                                    <polygon fill="#FFB700" points="15 15 9 15 9 9 15 9"></polygon>
                                  </g>
                                </svg>
                                <div>Pay with browser.</div>
                              </a>
                            </div>
                            <a href="/quotation" value="Continue to Checkout" bind="4bc36725-f958-4612-d2cb-e90fd749bb4f" class="w-commerce-commercecartcheckoutbutton checkout-button-2" data-loading-text="Einen Augenblick..." data-node-type="cart-checkout-button">To the checkout</a>
                            <a bind="22afc99a-d9af-463e-59bf-fb110f1b56f3" href="/cart" class="einkaufswagen-button w-button">Zum Einkaufswagen</a>
                          </div>
                        </div>
                      </form>
                      <div bind="4bc36725-f958-4612-d2cb-e90fd749bb50" class="w-commerce-commercecartemptystate">
                        <div class="empty-cart-content">
                          <div class="empty-cart-icon">
                            <img src="/images/bag-outline.svg" alt="Shopping bag" style="width: 64px; height: 64px; opacity: 0.3;">
                          </div>
                          <div aria-label="This cart is empty" aria-live="polite" class="text-block-110 empty-cart-message">Your cart is empty</div>
                          <p class="empty-cart-subtitle">Add items to your cart to continue shopping</p>
                          <a href="/" class="empty-cart-button button-outline-black w-inline-block">
                            <div class="button-text">Continue Shopping</div>
                          </a>
                        </div>
                      </div>
                      <div aria-live="assertive" bind="4bc36725-f958-4612-d2cb-e90fd749bb53" style="display:none" data-node-type="commerce-cart-error" class="w-commerce-commercecarterrorstate">
                        <div bind="4bc36725-f958-4612-d2cb-e90fd749bb54" class="error-message w-cart-error-msg" data-w-cart-quantity-error="Die angefragte Menge überschreitet die Verfügbarkeit." data-w-cart-general-error="Ups, irgendwas scheint schiefgelaufen zu sein." data-w-cart-checkout-error="Checkout ist auf dieser Seite deaktiviert." data-w-cart-cart_order_min-error="Mindestbestellwert nicht erreicht. Fügen Sie weitere Artikel hinzu." data-w-cart-subscription_error-error="Bitte bestätigen Sie vor dem Kauf Ihre Adresse per E-Mail-Einladung für Bestellupdates.">Die angefragte Menge überschreitet die Verfügbarkeit.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="mobile-nav">
        <div class="nav-top-bar">
          <div class="mobile-nav-container-90">
            <div data-w-id="4bc36725-f958-4612-d2cb-e90fd749bb58" class="menu-button">
              <div data-w-id="4bc36725-f958-4612-d2cb-e90fd749bb59" data-is-ix2-target="1" data-animation-type="lottie" data-src="/documents/animation_lmqenqw5.json" data-loop="0" data-direction="1" data-autoplay="0" data-renderer="svg" data-default-duration="2" data-duration="0" data-ix2-initial-state="0"></div>
            </div>
            <div class="nav-center">
              <a href="/" aria-current="page" class="nav-logo-link w-inline-block w--current"><img src="/images/stonearts®-logo-black-long.svg" loading="lazy" alt="" class="logo-stonearts"></a>
            </div>
            <div class="nav-right">
              <div class="button-wrapper-menu div-block-663 div-block-664 div-block-665">
                <div class="account-wrapper"><img src="/images/person-outline-2.svg" loading="lazy" alt="" class="image-121"></div>
                <div bind="4bc36725-f958-4612-d2cb-e90fd749bb61" data-open-product="" data-wf-cart-type="rightSidebar" data-wf-cart-query="" data-wf-page-link-href-prefix="" data-wf-cart-easing="ease-out-quart" data-wf-cart-duration="500" class="w-commerce-commercecartwrapper" data-node-type="commerce-cart-wrapper">
                  <a bind="4bc36725-f958-4612-d2cb-e90fd749bb62" class="w-commerce-commercecartopenlink cart-button-3 w-inline-block" role="button" aria-haspopup="dialog" aria-label="Open cart" data-node-type="commerce-cart-open-link" href="#">
                    <div bind="4bc36725-f958-4612-d2cb-e90fd749bb63" class="w-commerce-commercecartopenlinkcount cart-quantity-3">0</div><img src="/images/bag-outline.svg" loading="lazy" alt="" class="image-122">
                  </a>
                  <div bind="4bc36725-f958-4612-d2cb-e90fd749bb65" style="display:none" class="w-commerce-commercecartcontainerwrapper w-commerce-commercecartcontainerwrapper--cartType-rightSidebar" data-node-type="commerce-cart-container-wrapper">
                    <div bind="4bc36725-f958-4612-d2cb-e90fd749bb66" data-node-type="commerce-cart-container" role="dialog" class="w-commerce-commercecartcontainer cart-container-3">
                      <div bind="4bc36725-f958-4612-d2cb-e90fd749bb67" class="w-commerce-commercecartheader">
                        <h4 bind="4bc36725-f958-4612-d2cb-e90fd749bb68" class="w-commerce-commercecartheading heading-254"><img src="/images/bag-outline.svg" alt="Shopping cart" style="width: 24px; height: 24px;" /></h4>
                        <a bind="4bc36725-f958-4612-d2cb-e90fd749bb6a" class="w-commerce-commercecartcloselink w-inline-block" role="button" aria-label="Close cart" data-node-type="commerce-cart-close-link"><svg width="16px" height="16px" viewbox="0 0 16 16">
                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                              <g fill-rule="nonzero" fill="#333333">
                                <polygon points="6.23223305 8 0.616116524 13.6161165 2.38388348 15.3838835 8 9.76776695 13.6161165 15.3838835 15.3838835 13.6161165 9.76776695 8 15.3838835 2.38388348 13.6161165 0.616116524 8 6.23223305 2.38388348 0.616116524 0.616116524 2.38388348 6.23223305 8"></polygon>
                              </g>
                            </g>
                          </svg></a>
                      </div>
                      <div bind="4bc36725-f958-4612-d2cb-e90fd749bb6c" class="w-commerce-commercecartformwrapper">
                        <form bind="4bc36725-f958-4612-d2cb-e90fd749bb6d" style="display:none" class="w-commerce-commercecartform" data-node-type="commerce-cart-form">
                          <script type="text/x-wf-template" id="wf-template-4bc36725-f958-4612-d2cb-e90fd749bb6e"></script>
                          <div bind="4bc36725-f958-4612-d2cb-e90fd749bb6e" item="cart" template-bind="4bc36725-f958-4612-d2cb-e90fd749bb6e" class="w-commerce-commercecartlist" data-wf-collection="database.commerceOrder.userItems" data-wf-template-id="wf-template-4bc36725-f958-4612-d2cb-e90fd749bb6e"></div>
                          <div bind="4bc36725-f958-4612-d2cb-e90fd749bb7e" class="w-commerce-commercecartfooter">
                            <div aria-atomic="true" aria-live="polite" bind="4bc36725-f958-4612-d2cb-e90fd749bb7f" class="w-commerce-commercecartlineitem cart-line-item-2">
                              <div class="text-block-108">Total</div>
                              <div bind="4bc36725-f958-4612-d2cb-e90fd749bb82" class="w-commerce-commercecartordervalue text-block-126"></div>
                            </div>
                            <div bind="4bc36725-f958-4612-d2cb-e90fd749bb83">
                              <div data-node-type="commerce-cart-quick-checkout-actions" bind="4bc36725-f958-4612-d2cb-e90fd749bb84">
                                <a data-node-type="commerce-cart-apple-pay-button" role="button" aria-label="Apple Pay" aria-haspopup="dialog" style="background-image:-webkit-named-image(apple-pay-logo-white);background-size:100% 50%;background-position:50% 50%;background-repeat:no-repeat" class="w-commerce-commercecartapplepaybutton" tabindex="0">
                                  <div></div>
                                </a>
                                <a data-node-type="commerce-cart-quick-checkout-button" role="button" tabindex="0" aria-haspopup="dialog" style="display:none" class="w-commerce-commercecartquickcheckoutbutton"><svg class="w-commerce-commercequickcheckoutgoogleicon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16" viewbox="0 0 16 16">
                                    <defs>
                                      <polygon id="google-mark-a" points="0 .329 3.494 .329 3.494 7.649 0 7.649"></polygon>
                                      <polygon id="google-mark-c" points=".894 0 13.169 0 13.169 6.443 .894 6.443"></polygon>
                                    </defs>
                                    <g fill="none" fill-rule="evenodd">
                                      <path fill="#4285F4" d="M10.5967,12.0469 L10.5967,14.0649 L13.1167,14.0649 C14.6047,12.6759 15.4577,10.6209 15.4577,8.1779 C15.4577,7.6339 15.4137,7.0889 15.3257,6.5559 L7.8887,6.5559 L7.8887,9.6329 L12.1507,9.6329 C11.9767,10.6119 11.4147,11.4899 10.5967,12.0469"></path>
                                      <path fill="#34A853" d="M7.8887,16 C10.0137,16 11.8107,15.289 13.1147,14.067 C13.1147,14.066 13.1157,14.065 13.1167,14.064 L10.5967,12.047 C10.5877,12.053 10.5807,12.061 10.5727,12.067 C9.8607,12.556 8.9507,12.833 7.8887,12.833 C5.8577,12.833 4.1387,11.457 3.4937,9.605 L0.8747,9.605 L0.8747,11.648 C2.2197,14.319 4.9287,16 7.8887,16"></path>
                                      <g transform="translate(0 4)">
                                        <mask id="google-mark-b" fill="#fff">
                                          <use xlink:href="#google-mark-a"></use>
                                        </mask>
                                        <path fill="#FBBC04" d="M3.4639,5.5337 C3.1369,4.5477 3.1359,3.4727 3.4609,2.4757 L3.4639,2.4777 C3.4679,2.4657 3.4749,2.4547 3.4789,2.4427 L3.4939,0.3287 L0.8939,0.3287 C0.8799,0.3577 0.8599,0.3827 0.8459,0.4117 C-0.2821,2.6667 -0.2821,5.3337 0.8459,7.5887 L0.8459,7.5997 C0.8549,7.6167 0.8659,7.6317 0.8749,7.6487 L3.4939,5.6057 C3.4849,5.5807 3.4729,5.5587 3.4639,5.5337" mask="url(#google-mark-b)"></path>
                                      </g>
                                      <mask id="google-mark-d" fill="#fff">
                                        <use xlink:href="#google-mark-c"></use>
                                      </mask>
                                      <path fill="#EA4335" d="M0.894,4.3291 L3.478,6.4431 C4.113,4.5611 5.843,3.1671 7.889,3.1671 C9.018,3.1451 10.102,3.5781 10.912,4.3671 L13.169,2.0781 C11.733,0.7231 9.85,-0.0219 7.889,0.0001 C4.941,0.0001 2.245,1.6791 0.894,4.3291" mask="url(#google-mark-d)"></path>
                                    </g>
                                  </svg><svg class="w-commerce-commercequickcheckoutmicrosofticon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewbox="0 0 16 16">
                                    <g fill="none" fill-rule="evenodd">
                                      <polygon fill="#F05022" points="7 7 1 7 1 1 7 1"></polygon>
                                      <polygon fill="#7DB902" points="15 7 9 7 9 1 15 1"></polygon>
                                      <polygon fill="#00A4EE" points="7 15 1 15 1 9 7 9"></polygon>
                                      <polygon fill="#FFB700" points="15 15 9 15 9 9 15 9"></polygon>
                                    </g>
                                  </svg>
                                  <div>Pay with browser.</div>
                                </a>
                              </div>
                              <a href="/quotation" value="Continue to Checkout" bind="4bc36725-f958-4612-d2cb-e90fd749bb8c" class="w-commerce-commercecartcheckoutbutton checkout-button-3" data-loading-text="Einen Augenblick..." data-node-type="cart-checkout-button">Continue to Checkout</a>
                              <a bind="228b8eef-42c0-792b-692e-59e3ee23df8e" href="/cart" class="einkaufswagen-button w-button">Zum Einkaufswagen</a>
                            </div>
                          </div>
                        </form>
                        <div bind="4bc36725-f958-4612-d2cb-e90fd749bb8d" class="w-commerce-commercecartemptystate">
                          <div class="empty-cart-content">
                            <div class="empty-cart-icon">
                              <img src="/images/bag-outline.svg" alt="Shopping bag" style="width: 64px; height: 64px; opacity: 0.3;">
                            </div>
                            <div aria-label="This cart is empty" aria-live="polite" class="text-block-111 empty-cart-message">Your cart is empty</div>
                            <p class="empty-cart-subtitle">Add items to your cart to continue shopping</p>
                            <a href="/" class="empty-cart-button button-outline-black w-inline-block">
                              <div class="button-text">Continue Shopping</div>
                            </a>
                          </div>
                        </div>
                        <div aria-live="assertive" bind="4bc36725-f958-4612-d2cb-e90fd749bb90" style="display:none" data-node-type="commerce-cart-error" class="w-commerce-commercecarterrorstate">
                          <div bind="4bc36725-f958-4612-d2cb-e90fd749bb91" class="error-message-2 w-cart-error-msg" data-w-cart-quantity-error="Produkt in dieser Menge nicht verfügbar." data-w-cart-general-error="Fehler beim Hinzufügen zum Warenkorb." data-w-cart-checkout-error="Bestellabschluss deaktiviert." data-w-cart-cart_order_min-error="Mindestbestellwert nicht erreicht. Fügen Sie weitere Artikel hinzu." data-w-cart-subscription_error-error="Bitte bestätigen Sie vor dem Kauf Ihre Adresse per E-Mail-Einladung für Bestellupdates.">Produkt in dieser Menge nicht verfügbar.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="nav-mobile-drop">
          <div class="mobile-nav-container-90 drop">
            <div class="menu-left-align">
              <div class="menu-selection_wrap">
                <div class="accordion js-accordion">
                  <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749bb97-d749ba6b" class="accordion-item js-accordion-item">
                    <div class="accordion-header js-accordion-header">
                      <h3 class="mobile-nav-header">Shop</h3><img src="/images/plus-add-outline.svg" loading="lazy" width="32" alt="" class="js-accordion-icon">
                    </div>
                    <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749bb9c-d749ba6b" class="accordion-body js-accordion-body">
                      <div class="accordion-body_contents">
                        <a product-link="whisper" href="/product/whisper" class="accordion-body-link w-inline-block">
                          <h3 class="link-heading">Akurock Akustikpaneele</h3>
                        </a>
                        <a href="/akurock-muster" class="accordion-body-link w-inline-block">
                          <h3 class="link-heading">Muster bestellen</h3>
                        </a>
                        <a href="/zubehoer" class="accordion-body-link w-inline-block">
                          <h3 class="link-heading">Zubehör</h3>
                        </a>
                        <a href="/visualizer" class="accordion-body-link w-inline-block">
                          <h3 class="link-heading">Visualizer</h3>
                        </a>
                        <a href="/akustik" class="accordion-body-link w-inline-block">
                          <h3 class="link-heading">Wie funktioniert ein Akustikpaneel?</h3>
                        </a>
                        <a href="/installation-and-guide" class="accordion-body-link w-inline-block">
                          <h3 class="link-heading">Installationsanleitung</h3>
                        </a>
                      </div>
                    </div>
                  </div>
                  <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749bbaa-d749ba6b" class="accordion-item js-accordion-item">
                    <div class="accordion-header js-accordion-header">
                      <h3 class="mobile-nav-header">Inspiration</h3><img src="/images/plus-add-outline.svg" loading="lazy" width="32" alt="" class="js-accordion-icon">
                    </div>
                    <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749bbaf-d749ba6b" class="accordion-body js-accordion-body">
                      <div class="accordion-body_contents">
                        <a href="/galerie" class="accordion-body-link w-inline-block">
                          <h3 class="link-heading">Galerie</h3>
                        </a>
                        <a href="/stein-selektion" class="accordion-body-link w-inline-block">
                          <h3 class="link-heading">Unsere Steine</h3>
                        </a>
                        <a href="/stoneskin" class="accordion-body-link w-inline-block">
                          <h3 class="link-heading">Stoneskin</h3>
                        </a>
                        <a href="/blog-news" class="accordion-body-link w-inline-block">
                          <h3 class="link-heading">Unser Journal</h3>
                        </a>
                        <a href="#" class="accordion-body-link w-inline-block">
                          <h3 class="link-heading">Visualizer</h3>
                        </a>
                      </div>
                    </div>
                  </div>
                  <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749bbba-d749ba6b" class="accordion-item js-accordion-item">
                    <div class="accordion-header js-accordion-header">
                      <h3 class="mobile-nav-header">Kundenservice</h3><img src="/images/plus-add-outline.svg" loading="lazy" width="32" alt="" class="js-accordion-icon">
                    </div>
                    <div id="w-node-_4bc36725-f958-4612-d2cb-e90fd749bbbf-d749ba6b" class="accordion-body js-accordion-body">
                      <div class="accordion-body_contents">
                        <a href="/faq" class="accordion-body-link w-inline-block">
                          <h3 class="link-heading">Hilfe benötigt?</h3>
                        </a>
                        <a href="/faq" class="accordion-body-link w-inline-block">
                          <h3 class="link-heading">FAQs</h3>
                        </a>
                        <a href="/kontaktier-uns" class="accordion-body-link w-inline-block">
                          <h3 class="link-heading">Kontaktiere uns</h3>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="mobile-menu-link-wrap">
                  <div class="menu-mobile-block-wrap">
                    <div class="menu-mobile-block">
                      <a href="/uber-uns" class="link-block-18 w-inline-block">
                        <h3 class="header-menu-mobile">Über uns</h3>
                      </a>
                    </div>
                  </div>
                  <div class="menu-mobile-block-wrap">
                    <div class="menu-mobile-block">
                      <a href="/verantwortung" class="link-block-18 w-inline-block">
                        <h3 class="header-menu-mobile">Verantwortung</h3>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div class="menu-footer_wrap">
                <div class="slogan-wrap-mobile">
                  <h3 class="heading-209">#wemovemountains</h3>
                </div>
                <div class="social-wrap-mobile">
                  <a href="https://www.youtube.com/channel/UCpdPxE-_gXMg9hG_p3hvrkw" class="mobile-social-link w-inline-block"><img src="/images/Youtube-Circle-Black.svg" loading="lazy" width="30" alt="" class="social-icon"></a>
                  <a href="https://at.pinterest.com/17qo2x7ctqzuy3hlhny50ia1rfuphi/" class="mobile-social-link w-inline-block"><img src="/images/Pinterest-Circle-Black.svg" loading="lazy" width="30" alt="" class="social-icon"></a>
                  <a href="https://www.instagram.com/stonearts_official/" class="mobile-social-link w-inline-block"><img src="/images/Instagram-Circle-Black.svg" loading="lazy" width="30" alt="" class="social-icon"></a>
                  <a href="https://www.facebook.com/stoneartsglobal?_rdr" class="mobile-social-link w-inline-block"><img src="/images/facebook-circle-Black.svg" loading="lazy" width="30" alt="" class="social-icon"></a>
                  <a href="https://www.tiktok.com/@stonearts_official?is_from_webapp=1&amp;sender_device=pc" class="mobile-social-link w-inline-block"><img src="/images/tiktok-Circle-Black.svg" loading="lazy" width="30" alt="" class="social-icon"></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <main class="page_main">
      <section bind="9ce6595d-04a0-bdaf-3cab-00666a48b2e7" class="hero-section">
        <div class="main-hero_wrap">
          <div class="hero-slogan-wrap">
            <h1 option:text="Main-Heading" class="heading-245">Akurock</h1>
            <h2 option:text="Sub-Heading" class="hero-heading-2">Mehr als nur ein Akustikpaneel, eine Symphonie aus Stein und Design.</h2>
            <div class="button-hero-container">
              <a product-link="whisper" data-w-id="9ce6595d-04a0-bdaf-3cab-00666a48b2f1" href="/product/whisper" class="button-outline-white w-inline-block">
                <div class="button-text is-white">Jetzt Shoppen</div>
              </a>
            </div>
          </div>
          <div data-poster-url="/videos/Drama_New_2_poster.0000000.jpg" data-video-urls="/videos/Drama_New_2_mp4.mp4,videos/Drama_New_2_webm.webm" data-autoplay="true" data-loop="true" data-wf-ignore="true" option:video="Hero-Video" class="background-video w-background-video w-background-video-atom"><video id="9cb9fa54-4361-28f1-8c8e-9a4a8902da57-video" autoplay="" loop="" style="background-image:url(&quot;/videos/Drama_New_2_poster.0000000.jpg&quot;)" muted="" playsinline="" data-wf-ignore="true" data-object-fit="cover">
              <source src="/videos/Drama_New_2_mp4.mp4" data-wf-ignore="true">
              <source src="/videos/Drama_New_2_webm.webm" data-wf-ignore="true">
            </video></div>
        </div>
      </section>
      <section class="basic-grid-section slogan">
        <div class="basic-grid-container">
          <div id="w-node-_841f18dc-b448-e09b-5fcc-cf9b0b2bdb39-05f77d2f" class="product-hero-header-container slogan">
            <h3 class="under-text-hero-slogan">&quot;Den Rhythmus des Lebens feiernd, tragen unsere Heime die schönen Spuren der Zeit. Als Symbole einer gemeinsamen Reise.&quot;</h3>
          </div>
        </div>
      </section>
      <section bind="c4899ed3-05f7-53c6-4d62-c7367486433e" class="slider-section is-selection-main new">
        <div class="slider-container is-selection-main">
          <div class="slider-page-padding slider-1">
            <div class="slider-main_component">
              <div class="slider-main_overflow">
                <div class="slider-main_arrow swiper-prev mobile-main first">
                  <div bind="c4899ed3-05f7-53c6-4d62-c73674864344" class="html-embed in-reverse w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewbox="0 0 29.541 22.323">
                      <g id="Group_44" data-name="Group 44" transform="translate(0 1.014)">
                        <path id="Path_1" data-name="Path 1" d="M115.445,20.633l9.311-10.148L115.445.338" transform="translate(-97.25 -0.338)" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="3"></path>
                        <line id="Line_1" data-name="Line 1" x1="27.506" transform="translate(0 10.148)" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="3"></line>
                      </g>
                    </svg></div>
                </div>
                <div class="slider-main_arrow swiper-next mobile-main first">
                  <div bind="c4899ed3-05f7-53c6-4d62-c73674864346" class="html-embed w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewbox="0 0 29.541 22.323">
                      <g id="Group_44" data-name="Group 44" transform="translate(0 1.014)">
                        <path id="Path_1" data-name="Path 1" d="M115.445,20.633l9.311-10.148L115.445.338" transform="translate(-97.25 -0.338)" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="3"></path>
                        <line id="Line_1" data-name="Line 1" x1="27.506" transform="translate(0 10.148)" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="3"></line>
                      </g>
                    </svg></div>
                </div>
                <div>
                  <div class="slider-main_wrap">
                    <div class="swiper nocollection">
                      <div class="swiper-wrapper nocollection">
                        <div class="swiper-slide nocollection">
                          <div class="slider-main_image-height nocollection"><img src="/images/Skandi_Bedroom_3.webp" loading="lazy" sizes="(max-width: 1080px) 100vw, 1080px" srcset="/images/Skandi_Bedroom_3-p-500.webp 500w, /images/Skandi_Bedroom_3-p-800.webp 800w, images/Skandi_Bedroom_3.webp 1080w" alt="Skandinavisches Wohnzimmer mit Akurock-Akustikpaneelen – stilvolle Lamellenwand für eine ruhige und moderne Wohnatmosphäre" class="image-166">
                            <div class="overlay">
                              <div class="slider-main_text-wrapper nocollection">
                                <div class="slogan-text-wrapper">
                                  <h2 option:text="Header Kachel 1" class="heading-222">Verwandle dein Zuhause.</h2>
                                  <div option:textarea="Untertext Bento 1" class="text-block-78">Ein gesundes Raumklima mit Stil.</div>
                                </div>
                                <div class="button-container_nocollection">
                                  <a bind="c4899ed3-05f7-53c6-4d62-c73674864355" product-link="whisper" href="/product/whisper" class="button-outline-white _2 w-button">Jetzt Shoppen</a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="swiper-slide nocollection">
                          <div class="slider-main_image-height nocollection"><img src="/images/Mockup_AKUROCK_Visualizer_Small.webp" loading="lazy" alt="Top-Down-Ansicht von Akustikpaneelen in Weiß, Beige, Schwarz und Rot – dekorative Wandpaneele für moderne Wohnraumgestaltung" class="image-166">
                            <div class="overlay">
                              <div class="slider-main_text-wrapper nocollection">
                                <div class="slogan-text-wrapper">
                                  <h2 option:text="Header Kachel 2" class="heading-222">Visualizer probieren.</h2>
                                  <div option:textarea="Untertext Bento 2" class="text-block-78">Entdecke AKUROCK an deiner Wand.</div>
                                </div>
                                <div class="button-container_nocollection is-middle">
                                  <a bind="c4899ed3-05f7-53c6-4d62-c73674864361" href="/visualizer" class="button-outline-white _2 w-button">Jetzt Probieren</a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="swiper-slide nocollection">
                          <div class="slider-main_image-height nocollection"><img src="/images/Sample-0240316_small.webp" loading="lazy" sizes="(max-width: 1000px) 100vw, 1000px" srcset="/images/Sample-0240316_small-p-500.webp 500w, /images/Sample-0240316_small-p-800.webp 800w, images/Sample-0240316_small.webp 1000w" alt="Musterbox mit Akustikpaneelen – Materialien aus Marmor, Schiefer, Sandstein und Mica-Stein zur dekorativen Wandverkleidung" class="image-166">
                            <div class="overlay">
                              <div class="slider-main_text-wrapper nocollection">
                                <div class="slogan-text-wrapper">
                                  <h2 class="heading-222">Schwierigkeiten bei der Entscheidung?</h2>
                                  <div class="text-block-78">Probiere es an deiner Wand!</div>
                                </div>
                                <div class="button-container_nocollection">
                                  <a bind="c4899ed3-05f7-53c6-4d62-c7367486436d" href="/akurock-muster" class="button-outline-white _2 w-button">Musterboxen</a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="slider-main_bottom-wrapper is-slider-main">
                    <div class="swiper-drag-wrapper is-slider-main">
                      <div class="swiper-drag is-slider-main"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section bind="8a56b42d-4538-38c1-32b4-2089e2f8a554" class="basic-grid-section product">
        <div class="w-layout-blockcontainer container-medium w-container">
          <div id="w-node-_8a56b42d-4538-38c1-32b4-2089e2f8a556-e2f8a554" class="w-layout-layout quick-stack-4 wf-layout-layout">
            <div id="w-node-_8a56b42d-4538-38c1-32b4-2089e2f8a557-e2f8a554" class="w-layout-cell selection-tile _1">
              <a product-link="brush" data-w-id="8a56b42d-4538-38c1-32b4-2089e2f8a558" href="/product/whisper" class="selection-tile_img-wrapper _1 w-inline-block">
                <div class="selection-tile_text-wrapper">
                  <div class="arrow-wrapper"><img src="/images/Large-Arrow-White-Selection-1.svg" loading="lazy" width="31" alt="" class="image-137"></div>
                  <div class="wrapper">
                    <p option:textarea="Bento-Text 1" class="paragraph-77">Mit Liebe handgefertigt ist jedes Stück so einzigartig wie seine Herkunft.</p>
                    <h2 option:text="Link-Header 1" class="heading-174">Gestalte dein Zuhause.</h2>
                  </div>
                </div>
              </a>
            </div>
            <div id="w-node-_8a56b42d-4538-38c1-32b4-2089e2f8a561-e2f8a554" class="w-layout-cell selection-tile _2">
              <a data-w-id="8a56b42d-4538-38c1-32b4-2089e2f8a562" href="/visualizer" class="selection-tile_img-wrapper _2 w-inline-block">
                <div class="selection-tile_text-wrapper">
                  <div class="arrow-wrapper visualizer"><img src="/images/Large-Arrow-White-Selection-1.svg" loading="lazy" width="31" alt="" class="image-139"></div>
                  <div class="wrapper">
                    <p option:textarea="Bento-Text 2" class="paragraph-77">Entdecke AKUROCK an deiner Wand.</p>
                    <h2 option:text="Link-Header 2" class="heading-174">Probiere unseren <br>Visualizer.</h2>
                  </div>
                </div>
              </a>
            </div>
            <div id="w-node-_8a56b42d-4538-38c1-32b4-2089e2f8a56b-e2f8a554" class="w-layout-cell selection-tile _3">
              <a data-w-id="8a56b42d-4538-38c1-32b4-2089e2f8a56c" href="/akurock-muster" class="selection-tile_img-wrapper _3 w-inline-block">
                <div class="selection-tile_text-wrapper">
                  <div class="arrow-wrapper"><img src="/images/Large-Arrow-White-Selection-1.svg" loading="lazy" width="31" alt="" class="image-138"></div>
                  <div class="wrapper">
                    <p option:textarea="Bento-Text 3" class="paragraph-77">Schwierigkeiten bei der Entscheidung?</p>
                    <h2 option:text="Link-Header 3" class="heading-174">Probiere es an deiner Wand.</h2>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
      <section id="produkte" class="slider-section slider-1">
        <div class="slider-container main">
          <div class="slider-page-padding main">
            <div class="slider-main_component">
              <div class="slider-main_arrow swiper-prev mobile-main _2 main">
                <div bind="d7dc75c1-0154-e3b9-ed94-a9eebcaac123" class="arrow-embed is-reversed w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewbox="0 0 29.541 22.323">
                    <g id="Group_44" data-name="Group 44" transform="translate(0 1.014)">
                      <path id="Path_1" data-name="Path 1" d="M115.445,20.633l9.311-10.148L115.445.338" transform="translate(-97.25 -0.338)" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="3"></path>
                      <line id="Line_1" data-name="Line 1" x1="27.506" transform="translate(0 10.148)" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="3"></line>
                    </g>
                  </svg></div>
              </div>
              <div class="slider-main_arrow swiper-next mobile-main _2 main">
                <div bind="d8f12b51-7081-4095-09b0-29ca483694d9" class="arrow-embed w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewbox="0 0 29.541 22.323">
                    <g id="Group_44" data-name="Group 44" transform="translate(0 1.014)">
                      <path id="Path_1" data-name="Path 1" d="M115.445,20.633l9.311-10.148L115.445.338" transform="translate(-97.25 -0.338)" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="3"></path>
                      <line id="Line_1" data-name="Line 1" x1="27.506" transform="translate(0 10.148)" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="3"></line>
                    </g>
                  </svg></div>
              </div>
              <div class="slider-main_overflow">
                <div>
                  <div class="slider-main_top-wrapper is-slider-main">
                    <h2 class="slider-header is-slider-main">Welche Akurock-Akustikpaneele passen zu dir?</h2>
                  </div>
                  <div class="slider-main_wrap">
                    <div bind="64b2a859-d0e1-7585-034c-483b3d178395" class="swiper is-slider-main w-dyn-list">
                      <div bind="64b2a859-d0e1-7585-034c-483b3d178396" role="list" class="swiper-wrapper is-slider-main w-dyn-items">
                        <div bind="64b2a859-d0e1-7585-034c-483b3d178397" role="listitem" class="swiper-slide is-slider-main w-dyn-item">
                          <a bind="954d1e2d-1c25-171c-ba48-c9106b5f89ab" data-w-id="954d1e2d-1c25-171c-ba48-c9106b5f89ab" href="/product/brush" class="slider-selector_link is-slider-main w-inline-block">
                            <div data-w-id="954d1e2d-1c25-171c-ba48-c9106b5f89ac" class="slider-main_image-height is-slider-main"><img src="/images/Brush_Block.webp" loading="lazy" bind="954d1e2d-1c25-171c-ba48-c9106b5f89ad" alt="Brush" class="slider-main_image"><img bind="c129eaf9-507d-dd86-9a00-26cdeb57595f" loading="lazy" style="opacity:0" src="/images/Brush_Block.webp" alt="" class="slider-main_image-2"></div>
                            <div class="slider-main_text-wrapper is-slider-main">
                              <div class="slider-main_text-holder is-slider-main">
                                <h3 bind="954d1e2d-1c25-171c-ba48-c9106b5f89b0" class="heading-142">Brush</h3>
                                <h4 bind="954d1e2d-1c25-171c-ba48-c9106b5f89b2" class="heading-144">Cream-colored sandstone from Rajasthan</h4>
                              </div>
                              <div class="slider-main_price-holder">
                                <h3 data-commerce-type="variation-price" bind="954d1e2d-1c25-171c-ba48-c9106b5f89b4" class="heading-143">€ 220.00 EUR</h3>
                                <h3 bind="c33abfc6-c050-d306-1938-d8ba31a51270" class="heading-257"></h3>
                              </div>
                            </div>
                          </a>
                        </div>
                        <div class="swiper-slide is-slider-main w-dyn-item">
                          <a href="/product/whisper" class="slider-selector_link is-slider-main w-inline-block">
                            <div class="slider-main_image-height is-slider-main"><img src="/images/whisper_block.webp" loading="lazy" alt="Whisper" class="slider-main_image"><img loading="lazy" style="opacity:0" src="/images/whisper_block.webp" alt="" class="slider-main_image-2"></div>
                            <div class="slider-main_text-wrapper is-slider-main">
                              <div class="slider-main_text-holder is-slider-main">
                                <h3 class="heading-142">Whisper</h3>
                                <h4 class="heading-144">White sandstone acoustic panels</h4>
                              </div>
                              <div class="slider-main_price-holder">
                                <h3 class="heading-143">€ 220.00 EUR</h3>
                              </div>
                            </div>
                          </a>
                        </div>
                        <div class="swiper-slide is-slider-main w-dyn-item">
                          <a href="/product/ligia" class="slider-selector_link is-slider-main w-inline-block">
                            <div class="slider-main_image-height is-slider-main"><img src="/images/Ligia_block.webp" loading="lazy" alt="Ligia" class="slider-main_image"><img loading="lazy" style="opacity:0" src="/images/Ligia_block.webp" alt="" class="slider-main_image-2"></div>
                            <div class="slider-main_text-wrapper is-slider-main">
                              <div class="slider-main_text-holder is-slider-main">
                                <h3 class="heading-142">Ligia</h3>
                                <h4 class="heading-144">Dark stone acoustic panels</h4>
                              </div>
                              <div class="slider-main_price-holder">
                                <h3 class="heading-143">€ 220.00 EUR</h3>
                              </div>
                            </div>
                          </a>
                        </div>
                        <div class="swiper-slide is-slider-main w-dyn-item">
                          <a href="/product/yami" class="slider-selector_link is-slider-main w-inline-block">
                            <div class="slider-main_image-height is-slider-main"><img src="/images/Akurock_Variation_2.webp" loading="lazy" alt="Yami" class="slider-main_image"><img loading="lazy" style="opacity:0" src="/images/Akurock_Variation_2.webp" alt="" class="slider-main_image-2"></div>
                            <div class="slider-main_text-wrapper is-slider-main">
                              <div class="slider-main_text-holder is-slider-main">
                                <h3 class="heading-142">Yami</h3>
                                <h4 class="heading-144">Black slate acoustic panels</h4>
                              </div>
                              <div class="slider-main_price-holder">
                                <h3 class="heading-143">€ 220.00 EUR</h3>
                              </div>
                            </div>
                          </a>
                        </div>
                        <div class="swiper-slide is-slider-main w-dyn-item">
                          <a href="/product/gaia" class="slider-selector_link is-slider-main w-inline-block">
                            <div class="slider-main_image-height is-slider-main"><img src="/images/Gaia_Block.webp" loading="lazy" alt="Gaia" class="slider-main_image"><img loading="lazy" style="opacity:0" src="/images/Gaia_Block.webp" alt="" class="slider-main_image-2"></div>
                            <div class="slider-main_text-wrapper is-slider-main">
                              <div class="slider-main_text-holder is-slider-main">
                                <h3 class="heading-142">Gaia</h3>
                                <h4 class="heading-144">Fossil stone acoustic panels</h4>
                              </div>
                              <div class="slider-main_price-holder">
                                <h3 class="heading-143">€ 220.00 EUR</h3>
                              </div>
                            </div>
                          </a>
                        </div>
                        <div class="swiper-slide is-slider-main w-dyn-item">
                          <a href="/product/yuki" class="slider-selector_link is-slider-main w-inline-block">
                            <div class="slider-main_image-height is-slider-main"><img src="/images/yuki_block.webp" loading="lazy" alt="Yuki" class="slider-main_image"><img loading="lazy" style="opacity:0" src="/images/yuki_block.webp" alt="" class="slider-main_image-2"></div>
                            <div class="slider-main_text-wrapper is-slider-main">
                              <div class="slider-main_text-holder is-slider-main">
                                <h3 class="heading-142">Yuki</h3>
                                <h4 class="heading-144">White sandstone acoustic panels</h4>
                              </div>
                              <div class="slider-main_price-holder">
                                <h3 class="heading-143">€ 220.00 EUR</h3>
                              </div>
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="slider-main_bottom-wrapper is-slider-main slider-2">
                    <div class="swiper-drag-wrapper is-slider-main">
                      <div class="swiper-drag is-slider-main"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section bind="ddc08abd-21f1-e7ab-1784-dc1ce9f3ac8a" class="video_section">
        <div class="w-layout-blockcontainer container-medium w-container">
          <div class="bento-vid-container-large">
            <div class="slogan-wrapper main">
              <h2 class="heading-215">Deine Wand, dein Meisterwerk.</h2>
            </div>
            <div data-poster-url="/videos/Feeling_of_Home_Neu_poster.0000000.jpg" data-video-urls="/videos/Feeling_of_Home_Neu_mp4.mp4,videos/Feeling_of_Home_Neu_webm.webm" data-autoplay="true" data-loop="true" data-wf-ignore="true" option:video="video-component-2" class="bg-video-main-2 w-background-video w-background-video-atom"><video id="ddc08abd-21f1-e7ab-1784-dc1ce9f3ac8d-video" autoplay="" loop="" style="background-image:url(&quot;/videos/Feeling_of_Home_Neu_poster.0000000.jpg&quot;)" muted="" playsinline="" data-wf-ignore="true" data-object-fit="cover">
                <source src="/videos/Feeling_of_Home_Neu_mp4.mp4" data-wf-ignore="true">
                <source src="/videos/Feeling_of_Home_Neu_webm.webm" data-wf-ignore="true">
              </video></div>
          </div>
        </div>
      </section>
      <section class="section-bento-main">
        <div class="w-layout-blockcontainer container-medium bento w-container">
          <div class="w-layout-grid bento-grid-main">
            <div id="w-node-b0b3578b-1b4e-066b-388f-0e75cfbf5043-05f77d2f" class="div-block-674">
              <h2 class="heading-221">Lebe wild. <br>Wohne leise.  <br>Dein Stein. <br>Deine Ruhe.</h2>
              <div class="div-block-677">
                <a href="/akustik" class="akustik-link-block w-inline-block">
                  <div class="text-block-106">Mehr<br>erfahren</div>
                </a>
              </div>
            </div>
            <div id="w-node-_2f3a6e61-f481-5063-685e-dd3292470e0c-05f77d2f" class="div-block-675">
              <div class="img_container-reviberation"><img src="/images/Soundwave-new.svg" loading="lazy" alt="" class="image-161"></div>
              <div class="text-block-75">Reduziert Lärm und Nachhall</div>
            </div>
            <div id="w-node-afbbce74-ba15-1daa-41d2-c3f1006f69c0-05f77d2f" data-w-id="afbbce74-ba15-1daa-41d2-c3f1006f69c0" class="div-block-676">
              <a product-link="Brush" aria-label="Link zu den Akurock-Akustikpaneelen." href="/product/whisper" class="link-block-abs w-inline-block"></a>
              <div class="selection-tile_text-wrapper bento">
                <div class="arrow-wrapper bento"><img src="/images/Large-Arrow-White-Selection-1.svg" loading="lazy" width="31" alt="" class="image-137"></div>
                <div class="wrapper bento select">
                  <p class="paragraph-77 bento-main _3">Es fühlt sich einfach anders an, nimm es in die Hand!</p>
                  <h2 class="heading-174 bento-main">Schaffe einzigartige Lebensräume!</h2>
                </div>
              </div>
              <a product-link="brush" data-w-id="f20ab0b2-2c64-464a-edde-ade17feb39fd" style="background-color:rgba(255,255,255,0)" href="/product/whisper" class="button-outline-white _2 bento w-inline-block">
                <div class="button-text is-white">Jetzt Shoppen</div>
              </a>
            </div>
          </div>
        </div>
      </section>
      <section class="section-bento-main full-screen">
        <div class="w-layout-blockcontainer container-medium full-screen w-container">
          <a data-w-id="72bfa5ef-fcc6-53ff-8207-ccf2c98a933f" href="/stein-selektion" class="background_bento-wrap w-inline-block">
            <div class="selection-tile_text-wrapper bento background">
              <div class="arrow-wrapper bento visualizer"><img src="/images/Large-Arrow-White-Selection-1.svg" loading="lazy" width="31" alt="" class="image-137 _2"></div>
              <div class="wrapper bento _2">
                <p class="paragraph-77 bento-main _2">Die Seele des Steins.</p>
                <h2 class="heading-174 bento-main _2">Die Kunst der Natur.</h2>
              </div>
            </div>
            <div id="w-node-_7661538e-f5ea-2a50-37d1-8f555f4f3efa-05f77d2f" class="img-wrapper_bento-full">
              <div class="img_container_background"><img src="/images/AKUROCK_Wandpaneele_Steinzeit.webp" loading="lazy" alt="Handy zeigt Visualisierung von Akustikpaneelen an einer Wand – Link zum Visualizer für die Planung der Wandverkleidung" class="image-162"></div>
            </div>
          </a>
        </div>
      </section>
      <section class="basic-section shout-out">
        <div class="basic-container hero-image main">
          <div class="page-padding shout-out">
            <div aria-label="Industrial Interior Design mit schwarzem Schiefer und olivgrüner Couch – moderne Wohnraumgestaltung mit Akustikpaneelen" role="img" class="large-img-wrapper main">
              <div class="shout-out-container main">
                <h2 class="slogan _2 text">Modern und ruhig? Dein Zuhause kann beides.</h2>
                <a product-link="Yami" data-w-id="2fbb04af-ca47-ce46-5d1d-0514c131ba95" style="background-color:rgba(255,255,255,0)" href="/product/whisper" class="button-outline-white w-inline-block">
                  <div class="button-text is-white">Jetzt Shoppen</div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section bind="745122dd-e573-cd39-9f8a-0f39ae9896c3" class="basic-section slogan main">
        <div class="basic-container">
          <div class="page-padding slogan">
            <div id="w-node-_745122dd-e573-cd39-9f8a-0f39ae9896c6-ae9896c3" class="slogan-wrapper">
              <div option:text="Ausrufung" class="text-block-67">Wir helfen dir, deinen Raum zum Singen zu bringen, mit einer Mischung aus skandinavischem und japanischem Design, das stilvoll und funktional ist. </div>
            </div>
          </div>
        </div>
      </section>
      <div class="section main social">
        <div class="container main social">
          <div bind="858eacac-a120-c74c-6cbf-2c7eb8d66747" class="code-embed-3 w-embed w-script">
            <div class="embedsocial-hashtag" data-ref="3737eac229ab10ae3d5348681c86ac09bd278a67"></div>
            <script> (function(d, s, id) { var js; if (d.getElementById(id)) {d.getElementById(id).parentNode.removeChild(d.getElementById(id));} js = d.createElement(s); js.id = id; js.src = "https://embedsocial.com/cdn/ht.js"; d.getElementsByTagName("head")[0].appendChild(js); }(document, "script", "EmbedSocialHashtagScript")); </script>
          </div>
        </div>
      </div>
      <section bind="4042225b-17d3-9364-9626-b26687d91215" class="basic-section main">
        <div class="container-medium">
          <div class="w-layout-grid basic-grid sustainability health">
            <div id="w-node-_4042225b-17d3-9364-9626-b26687d91218-87d91215" class="basic-img-wrapper sustainability">
              <div aria-label="Schlafzimmer im Japandi-Stil mit hell weißem, marmorveredeltem Akustikpaneel – moderne und beruhigende Schlafzimmergestaltung." role="img" class="img-container health"></div>
              <div class="health-text-container">
                <div class="health-slogan-text-wrapper">
                  <h2 option:text="Header 1" class="health-text-slogan">Beruhige den Lärm.</h2>
                  <p option:textarea="Paragraph 1" class="paragraph-70">Ein gesundes Klangumfeld zu schaffen, war noch nie so einfach.</p>
                </div>
                <a product-link="Yuki" href="/product/whisper" class="link-7">Erkunde Akurock</a>
              </div>
            </div>
            <div id="w-node-_4042225b-17d3-9364-9626-b26687d91222-87d91215" class="basic-img-wrapper">
              <div aria-label="Handwerkliche Bearbeitung eines weißen Sandsteins mit traditionellen Werkzeugen – hochwertige Natursteinverarbeitung bei stonearts®." role="img" class="img-container health _2">
                <div class="health-text-container">
                  <div class="health-slogan-text-wrapper">
                    <h2 option:text="Header 2" class="health-text-slogan">Stein mal anders.</h2>
                    <p option:textarea="Paragraph 2" class="paragraph-70">Es ist so einfach wie das Aufhängen deiner Bilder.</p>
                  </div>
                  <a href="/stoneskin" class="link-7">Erfahre mehr</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="basic-section lets-reconnect">
        <div class="basic-container super-large-image">
          <div class="page-padding super-large-image">
            <div class="super-large-image-wrapper">
              <div class="text-wrapper-super-large-image">
                <div class="content-container">
                  <div class="button-hero-container about-us">
                    <div class="img-sustian_container"><img src="/images/We-Care-about-our-future-slogan.png" loading="lazy" sizes="(max-width: 730px) 100vw, 730px" srcset="/images/We-Care-about-our-future-slogan-p-500.png 500w, /images/We-Care-about-our-future-slogan.png 730w" alt=""></div>
                    <a data-w-id="f3b54c87-77bf-9d70-b847-9c6de9ea4b87" style="background-color:rgba(255,255,255,0)" href="/verantwortung" class="button-outline-white about-us w-inline-block">
                      <div class="button-text is-white">Nachhaltige Verantwortung</div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="section-2 review">
        <div class="w-layout-blockcontainer basic-container social w-container">
          <div class="review-wrapper">
            <div bind="7c198a7d-a2a0-8c78-bd8b-2ef291aab7a3" class="code-embed w-embed w-script">
              <div class="embedsocial-hashtag" data-ref="af23508f8bfa9c29a9c3c2c212383fd16ec59b8b"></div>
              <script> (function(d, s, id) { var js; if (d.getElementById(id)) {return;} js = d.createElement(s); js.id = id; js.src = "https://embedsocial.com/cdn/ht.js"; d.getElementsByTagName("head")[0].appendChild(js); }(document, "script", "EmbedSocialHashtagScript")); </script>
            </div>
          </div>
        </div>
      </section>
    </main>
    <section bind="b1144648-ea22-8332-4fb8-cb5f7119a779" class="footer-section">
      <div class="footer-container">
        <div class="footer-content-wrapper">
          <div class="w-layout-grid footer-main-grid">
            <div id="w-node-b1144648-ea22-8332-4fb8-cb5f7119a789-7119a779" class="footer-main_container">
              <div class="w-layout-grid footer-grid-main_container">
                <div id="w-node-b1144648-ea22-8332-4fb8-cb5f7119a7af-7119a779" class="footer-main-block news">
                  <div id="w-node-_03e1f4f9-4e9b-b182-a8bf-30348856e182-7119a779" class="footer-main-block newsletter">
                    <div bind="b1144648-ea22-8332-4fb8-cb5f7119a7b0" class="form-block-2 w-form">
                      <form id="wf-form-Subscribe" name="wf-form-Subscribe" data-name="Subscribe" method="get" class="form-2" data-wf-page-id="64ad4116e38ed7d405f77d2f" data-wf-element-id="b1144648-ea22-8332-4fb8-cb5f7119a7b1"><label for="Newsletter-2" class="field-label">Verbinden wir uns</label>
                        <div class="flex-wrapper-newsletter"><input class="text-field-6 w-input" maxlength="256" name="Newsletter-2" data-name="Newsletter 2" placeholder="Deine Email" type="email" id="Newsletter-2" required=""><input type="submit" data-wait="Please wait..." class="submit-button-newsletter w-button" value=""></div><label class="w-checkbox">
                          <div class="w-checkbox-input w-checkbox-input--inputType-custom checkbox-newsletter"></div><input type="checkbox" name="checkbox-2" id="checkbox-2" data-name="Checkbox 2" style="opacity:0;position:absolute;z-index:-1"><span class="checkbox-label w-form-label" for="checkbox-2">Ja, ich möchte den Newsletter von stonearts® erhalten, und ich akzeptiere die Bedingungen der <a href="/cookie-und-datschenschutzerklaerung" class="link-11">Datenschutzrichtlinien.</a></span>
                        </label>
                      </form>
                      <div class="w-form-done">
                        <div>Thank you! Your submission has been received!</div>
                      </div>
                      <div class="w-form-fail">
                        <div>Oops! Something went wrong while submitting the form.</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div id="w-node-b1144648-ea22-8332-4fb8-cb5f7119a793-7119a779" class="footer-main-block links">
                  <div id="w-node-b1144648-ea22-8332-4fb8-cb5f7119a794-7119a779" class="w-layout-layout quick-stack wf-layout-layout">
                    <div id="w-node-b1144648-ea22-8332-4fb8-cb5f7119a795-7119a779" class="w-layout-cell cell-26">
                      <h3 class="heading-150">Brauchst du Hilfe?</h3>
                      <div class="link-block-holder-footer">
                        <a href="/kontaktier-uns" class="footer-links">Kontaktiere uns</a>
                        <a href="/installation-and-guide" class="footer-links">Installationsguide</a>
                        <a href="/zahlung-und-versand" class="footer-links">Zahlung &amp; Versand</a>
                        <a href="/faq" class="footer-links">FAQs</a>
                      </div>
                    </div>
                    <div id="w-node-b1144648-ea22-8332-4fb8-cb5f7119a7a3-7119a779" class="w-layout-cell cell-22">
                      <div>
                        <h3 class="heading-150">Company</h3>
                        <div class="link-block-holder-footer">
                          <a href="/stein-selektion" class="footer-links">Unsere Steine</a>
                          <a href="/stoneskin" class="footer-links">Stoneskin</a>
                          <a href="/uber-uns" class="footer-links">Über uns</a>
                          <a href="/verantwortung" class="footer-links">Verantwortung</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div id="w-node-b1144648-ea22-8332-4fb8-cb5f7119a7c1-7119a779" class="follow-us-wrapper">
                  <div id="w-node-c864b520-897b-0062-ab70-2c8afeac0149-7119a779" class="slogan-wrap-footer"><img src="/images/stonearts®-logo-black-long.svg" loading="lazy" width="151" alt="" class="image-123"></div>
                  <h3 class="heading-148">#follow us</h3>
                  <div class="social-media-icon_wrapper">
                    <a href="https://www.facebook.com/stoneartsglobal?_rdr" target="_blank" class="social-media-link w-inline-block"><img src="/images/facebook-circle-Black.svg" loading="lazy" width="39" alt="" class="image-99"></a>
                    <a href="https://www.instagram.com/stonearts_official/" target="_blank" class="social-media-link w-inline-block"><img src="/images/Instagram-Circle-Black.svg" loading="lazy" width="38" alt="" class="image-100"></a>
                    <a href="https://www.youtube.com/channel/UCpdPxE-_gXMg9hG_p3hvrkw" target="_blank" class="social-media-link w-inline-block"><img src="/images/Youtube-Circle-Black.svg" loading="lazy" width="39" alt="" class="image-101"></a>
                    <a href="https://www.tiktok.com/@stonearts_official?is_from_webapp=1&amp;sender_device=pc" target="_blank" class="social-media-link w-inline-block"><img src="/images/tiktok-Circle-Black.svg" loading="lazy" width="39" alt="" class="image-102"></a>
                    <a href="https://at.pinterest.com/17qo2x7ctqzuy3hlhny50ia1rfuphi/" target="_blank" class="social-media-link w-inline-block"><img src="/images/Pinterest-Circle-Black.svg" loading="lazy" width="41" alt="" class="image-135"></a>
                  </div>
                </div>
                <div id="w-node-b1144648-ea22-8332-4fb8-cb5f7119a78b-7119a779" class="footer-main-block logo">
                  <div class="follow_us_wrapper">
                    <div class="payment-options-wrapper"><img src="/images/5e905dee2a9d698070cfc797_Paypal.svg" loading="lazy" width="47" alt="" class="image-103"><img src="/images/5fb0641eb3236f6b8331173c_Visa.svg" loading="lazy" width="47" alt="" class="image-103"><img src="/images/5fb0641eb3236f4208311736_Mastercard.svg" loading="lazy" width="40" alt="" class="image-104"><img src="/images/5fb0641eb3236f5eb731172c_Maestro.svg" loading="lazy" width="40" alt="" class="image-104"><img src="/images/logo_black.png" loading="lazy" width="65" alt="" class="image-134"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div id="w-node-_566d5ec0-7f80-6106-7828-48e055f029e8-7119a779" class="slogan_shoutout_wrapper footer">
            <h4 class="heading-147 is-footer">wir versetzen berge</h4>
          </div>
          <div id="w-node-b1144648-ea22-8332-4fb8-cb5f7119a7d3-7119a779" class="footer-footer-note">
            <div class="footer-footer-wrapper">
              <div class="footer-padding">
                <div class="rights-wrapper">
                  <h3 class="heading-149">© 2025 stonearts® all rights reserved</h3>
                </div>
                <div class="company-details-wrapper">
                  <a href="/allgemeine-geschaeftsbedingungen" class="legal-links w-inline-block">
                    <h3 class="heading-151">AGBs</h3>
                  </a>
                  <a href="/cookie-und-datschenschutzerklaerung" class="legal-links w-inline-block">
                    <h3 class="heading-151">Datenschutz</h3>
                  </a>
                  <a href="/impressum" class="legal-links w-inline-block">
                    <h3 policy-link="terms" class="heading-151">Impressum</h3>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
  `;
  return (
    <div dangerouslySetInnerHTML={{ __html: translateHTML(rawHTML, locale as Locale) }} />
  );
}
