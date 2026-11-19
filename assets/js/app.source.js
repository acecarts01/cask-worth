var currentPayMethod = "crypto";
/* ═══════════════════════════════════════════════════════
   CASKWORTH — app.js
   Products, Cart, QR Codes, UI, Checkout
   ═══════════════════════════════════════════════════════ */
'use strict';

var ASSET_V = '20260811';

var CATALOG_V = '20261119a';
var _catalogCbs = null;
// loads the product catalogue on demand (cart add / quick view on pages that do not ship it up front)
function loadCatalog(cb){
  if(typeof PRODUCTS!=='undefined'){if(cb)cb();return;}
  if(cb)(_catalogCbs=_catalogCbs||[]).push(cb);
  if(document.getElementById('cw-catalog'))return;
  var s=document.createElement('script');s.id='cw-catalog';s.src='/assets/js/catalog.js?v='+CATALOG_V;
  s.onload=function(){var q=_catalogCbs||[];_catalogCbs=null;q.forEach(function(f){f();});};
  s.onerror=function(){var el=document.getElementById('cw-catalog');if(el)el.remove();_catalogCbs=null;showToast('Could not load product data. Please check your connection and try again.');};
  document.head.appendChild(s);
}

const FEATURED_IDS = ['p901','p906','p912','p1001','p924','p1019','p1028','p1029'];
const MIN_ORDER = 249.99;

const CRYPTO_DISCOUNT = 0.10;  // 10% off all crypto payments

function getDiscountedTotal(){
  var sub = getSubtotal();
  var discount = Math.round(sub * CRYPTO_DISCOUNT * 100) / 100;
  return { sub: sub, discount: discount, total: sub - discount };
}

function updateCryptoDiscount(){
  var isCrypto = (currentPayMethod === 'crypto');
  var discRow  = document.getElementById('ob-disc-row');
  var discAmt  = document.getElementById('ob-disc-amt');
  var totalEl  = document.getElementById('ob-total-val');
  var subEl    = document.getElementById('ob-sub');
  var dt = getDiscountedTotal();
  if(subEl)    subEl.textContent   = '$' + dt.sub.toFixed(2);
  if(discRow)  discRow.style.display = isCrypto ? 'flex' : 'none';
  if(discAmt)  discAmt.textContent   = '-$' + dt.discount.toFixed(2);
  if(totalEl)  totalEl.textContent = '$' + (isCrypto ? dt.total : dt.sub).toFixed(2);
  if(typeof updateMinOrderProgress==='function') updateMinOrderProgress();
}
function updateOrderSummaryDisplay(method){
  if(method) currentPayMethod = method;
  updateCryptoDiscount();
}

const WALLETS = [
  {id:'usdt-eth',label:'USDT (ETH)',icon:'₮',addr:'0x2629c24d3720E5A24adBe7Bde4677334B559C36D',network:'ERC-20'},
  {id:'usdt-trx',label:'USDT (TRX)',icon:'₮',addr:'TVQGzSJKcHXTwX6Fn8CPb6A5PmAkoCFZRh',network:'TRC-20'},
  {id:'btc',label:'Bitcoin',icon:'₿',addr:'bc1qdhgnlpctw37vg825eejkknurpm23a5lsthfdhg',network:'BTC'},
  {id:'eth',label:'Ethereum',icon:'Ξ',addr:'0x2629c24d3720E5A24adBe7Bde4677334B559C36D',network:'ERC-20'},
  {id:'sol',label:'Solana',icon:'◎',addr:'GdNUybxyu8cBY7snHAZsdopH6WKdHBVXo5d79mR9PhJ',network:'SOL'},
  {id:'xrp',label:'XRP',icon:'✕',addr:'rBiWxdA3a27BXYC9ZwQRTyFdXNWaEjLfBr',network:'XRP'},
  {id:'bnb',label:'BNB',icon:'⬡',addr:'0x2629c24d3720E5A24adBe7Bde4677334B559C36D',network:'BEP-20'},
];

var cart = [];
function loadCart(){try{cart=JSON.parse(localStorage.getItem('cw_cart'))||[];}catch(e){cart=[];}}
function saveCart(){try{localStorage.setItem('cw_cart',JSON.stringify(cart));}catch(e){}}
function getSubtotal(){return cart.reduce((s,i)=>s+i.price*i.qty,0);}
function _findProduct(id){
  var _all = [].concat(
    (typeof PRODUCTS!=='undefined'?PRODUCTS:[]),
    (typeof NEW_PRODUCTS!=='undefined'?NEW_PRODUCTS:[]),
    (typeof ULTRA_PRODUCTS!=='undefined'?ULTRA_PRODUCTS:[]),
    (typeof MORE_PRODUCTS!=='undefined'?MORE_PRODUCTS:[])
  );
  return _all.find(function(x){return x.id===id||x.id==id;});
}
function addToCart(id,qty){
  if(typeof PRODUCTS==='undefined'){loadCatalog(function(){addToCart(id,qty);});return;}
  qty=qty||1;
  const p=_findProduct(id);
  if(!p)return;
  const ex=cart.find(x=>x.id===id);
  if(ex){ex.qty+=qty;}else{cart.push({id:p.id,name:p.name,price:p.price,qty,img:p.img,cat:p.cat});}
  saveCart();updateCartUI();
  showToast('✓ '+p.name.substring(0,30)+' added to cart');
  openCart();
}
function openCart(){
  var ov=document.getElementById('cart-overlay');
  var dr=document.getElementById('cart-drawer');
  if(ov&&!ov.classList.contains('open'))ov.classList.add('open');
  if(dr&&!dr.classList.contains('open'))dr.classList.add('open');
  if(typeof renderCartItems==='function')renderCartItems();
}
function cartQty(id,d){
  const item=cart.find(x=>x.id===id||String(x.id)===String(id));
  if(!item)return;
  item.qty+=d;
  if(item.qty<=0)cart=cart.filter(x=>x.id!==id&&String(x.id)!==String(id));
  saveCart();updateCartUI();renderCartItems();
}
function cartRemove(id){cart=cart.filter(x=>x.id!==id&&String(x.id)!==String(id));saveCart();updateCartUI();renderCartItems();}
function updateCartUI(){
  const total=cart.reduce((s,i)=>s+i.qty,0);
  document.querySelectorAll('.cart-count').forEach(el=>{el.textContent=total;el.style.display=total>0?'flex':'none';});
}

/* Slugs that have a real static product page. Products not listed here
   open the quick-view modal instead of linking to a 404. */
const CW_VALID_PDP = new Set(["a-de-fussigny-xo-cognac", "aberfeldy-12-year", "aberfeldy-16-year", "aberlour-12-year-double-cask", "aberlour-16-year-double-cask", "aberlour-18-year", "aberlour-abunadh-cask-strength", "alberta-premium-25-year", "alberta-premium-30-year-dark-horse", "alberta-premium-cask-strength-rye", "ancnoc-12-year", "ancnoc-18-year", "angels-envy-cask-strength-port-finish", "angels-envy-finished-in-tawny-port-barrels", "angels-envy-kentucky-straight-bourbon", "angels-envy-rye-whiskey", "ardbeg-25-year-timeless", "argonaut-fat-thumb-california-brandy", "around-the-world-whisky-experience", "auchentoshan-american-oak", "auchentoshan-three-wood", "balvenie-21-year-portwood", "balvenie-30-year", "balvenie-50-year", "barsol-quebranta-pisco", "basil-haydens-10-year", "basil-haydens-dark-rye", "basil-haydens-kentucky-straight-bourbon", "basil-haydens-toast", "benriach-50-year", "benromach-10-year", "benromach-15-year", "bisquit-dubouche-caractere", "bisquit-dubouche-extra", "bisquit-dubouche-vs", "bisquit-dubouche-vsop", "bisquit-dubouche-xo", "blantons-gold-edition", "blantons-original-single-barrel", "blantons-straight-from-the-barrel", "bowmore-25-year", "bowmore-50-year", "brora-40-year-annual-release", "buffalo-trace-bourbon", "bulleit-bourbon", "bulleit-rye", "busnel-vsop-calvados", "calvados-pere-magloire-1901-vintage", "camus-cuvee-5150-grande-champagne", "camus-extra-elegance", "camus-vs-elegance", "camus-vsop-elegance", "camus-xo-borderies", "camus-xo-elegance", "canadian-club-100-rye-aged-8-year", "canadian-club-30-year", "canadian-club-40-year", "canadian-club-chronicles-issue-no5", "canadian-club-classic-12-year-limited-edition", "capel-premium-pisco", "cardenal-mendoza-brandy", "chateau-de-laubade-1888-vintage-armagnac", "chateau-de-laubade-vsop-armagnac", "chateau-de-laubade-xo-armagnac", "chateau-du-breuil-xo-calvados", "chivas-brothers-blend", "chivas-regal-12-year", "chivas-regal-18-year-gold-signature", "chivas-regal-18-year-ultimate-cask-collection", "chivas-regal-25-year", "chivas-regal-extra-13-year-american-rye-cask", "chivas-regal-extra-13-year-oloroso-cask", "chivas-regal-extra-13-year-rum-cask", "chivas-regal-extra-13-year-sherry-cask", "chivas-regal-icon", "chivas-regal-mizunara", "chivas-regal-ultis", "chivas-regal-xv-15-year", "christian-brothers-vs-brandy", "christian-drouin-calvados-vsop", "clear-creek-apple-brandy", "collingwood-21-year-rare-limited", "compass-box-asyla-blended-scotch", "compass-box-no-name-no3", "compass-box-orchard-house", "compass-box-the-peat-monster", "courvoisier-12-year", "courvoisier-21-year", "courvoisier-l-essence", "courvoisier-lesprit-original-1800s-reserve", "courvoisier-rose", "courvoisier-succession-js", "courvoisier-vs", "courvoisier-vsop", "courvoisier-xo", "crown-royal-18-year-extra-rare", "crown-royal-black", "crown-royal-deluxe", "crown-royal-extra-rare-xr-limited", "crown-royal-noble-collection-cornerstone-blend", "crown-royal-noble-collection-winter-wheat", "crown-royal-xo", "d-usse-cabaret-edition", "d-usse-limited-edition-750ml", "d-usse-vsop-cognac", "d-usse-xo-cognac", "dalmore-25-year", "dalmore-62-year-trinitas", "dalmore-luminary-no3-1987", "delamain-pale-dry-xo", "delord-15-year-armagnac", "delord-25-year-armagnac", "dewars-12-year", "dewars-15-year", "dewars-18-year", "dewars-25-year", "dewars-caribbean-smooth-8-year", "dewars-double-double-21-year", "dewars-double-double-27-year", "dewars-double-double-32-year", "dewars-ilegal-smooth-mezcal-cask", "dewars-scratched-cask-8-year", "dewars-white-label", "eagle-rare-10-year", "eh-taylor-small-batch-bib", "ej-vs-brandy", "ej-vsop-brandy", "elijah-craig-18-year-single-barrel", "elijah-craig-barrel-proof-bourbon", "elijah-craig-small-batch-bourbon", "elijah-craig-toasted-barrel", "evan-williams-black-label", "evan-williams-single-barrel-vintage", "famous-grouse-smoky-black", "forty-creek-blood-oath-pact-no7", "forty-creek-confederation-oak-reserve", "forty-creek-double-barrel-reserve", "forty-creek-heart-of-gold", "forty-creek-rye-whisky-masters-cut", "four-roses-limited-edition-small-batch", "four-roses-small-batch", "frapin-1858-grande-champagne-1er-cru", "frapin-chateau-fontpinot-xo", "george-dickel-rye-1988-cask-strength-heritage", "george-t-stagg-1978-single-barrel", "george-t-stagg-2007-vintage-release", "george-t-stagg-barrel-proof", "gimli-distillery-crown-royal-cask-series-no16", "glendronach-12-year-original", "glendronach-15-year-revival", "glendronach-18-year-allardice", "glendronach-21-year-parliament", "glenfarclas-10-year", "glenfarclas-15-year", "glenfarclas-21-year", "glenfiddich-12-year", "glenfiddich-18-year", "glenfiddich-1937-rare-collection", "glenfiddich-26-year-excellence", "glenfiddich-30-year", "glenfiddich-40-year", "glenfiddich-50-year", "glenlivet-21-year-archive", "glenlivet-50-year", "glenmorangie-18-year-extremely-rare", "glenmorangie-a-tale-of-cake", "glenmorangie-nectar-dor-12-year", "glenmorangie-original-10-year", "glenmorangie-quinta-ruban-14-year", "glenmorangie-signet", "glenora-glen-breton-rare-25-year", "grants-triple-wood", "green-spot-chateau-leoville-barton-1989-vintage", "green-spot-single-pot-still", "hakushu-12-year", "hakushu-18-year", "hakushu-35-year", "hennessy-8", "hennessy-black", "hennessy-classivm", "hennessy-ellipse", "hennessy-ellipse-baccarat-crystal-1-of-100", "hennessy-master-blenders-selection-no5", "hennessy-paradis", "hennessy-paradis-imperial", "hennessy-pure-white", "hennessy-richard-hennessy", "hennessy-vs", "hennessy-vsop-privilege", "hennessy-vsop-privilege-limited-edition", "hennessy-xo", "hennessy-xo-limited-edition-by-marc-newson", "hennessy-xo-limited-edition-by-ridley-scott", "hibiki-21-year", "hibiki-30-year", "hibiki-35-year", "hibiki-harmony", "highland-park-25-year", "highland-park-50-year", "highwood-20-year-centennial-limited", "highwood-25-year-presidents-reserve", "hine-antique-xo-premier-cru", "hine-h-by-hine-vsop", "hine-rare-vsop", "hine-triomphe-grande-champagne", "jack-daniels-10-year", "jack-daniels-gentleman-jack", "jack-daniels-old-no-7", "jack-daniels-sinatra-select", "jack-daniels-single-barrel", "jack-daniels-tennessee-apple", "jack-daniels-tennessee-fire", "jack-daniels-tennessee-honey", "jacopo-poli-sarpa-di-poli", "jameson-black-barrel", "jameson-original", "janneau-1904-vintage-grand-armagnac", "janneau-vsop-grand-armagnac", "janneau-xo-grand-armagnac", "japanese-whisky-trio", "jim-beam-black-extra-aged", "jim-beam-bonded-4-year", "jim-beam-double-oak", "jim-beam-original-white-label", "johnnie-walker-aged-18-year", "johnnie-walker-black-label-12-year", "johnnie-walker-blenders-batch-red-rye-finish", "johnnie-walker-blue-label", "johnnie-walker-blue-label-elusive-ports", "johnnie-walker-blue-label-ghost-rare-port-dundas", "johnnie-walker-blue-label-xordinaire", "johnnie-walker-blue-label-year-of-the-dragon-2024", "johnnie-walker-double-black", "johnnie-walker-gold-label-reserve", "johnnie-walker-green-label-15-year", "johnnie-walker-king-george-v", "johnnie-walker-platinum-label-18-year", "johnnie-walker-red-label", "johnnie-walker-swing", "johnnie-walker-the-john-walker", "johnnie-walker-xr-21-year", "jp-wisers-18-year-dissertation", "jp-wisers-35-year", "karuizawa-1960-single-cask", "karuizawa-1960-single-cask-no3603", "karuizawa-1964-noh-whisky-single-cask", "karuizawa-1967-single-cask", "karuizawa-1984-single-cask", "kelt-tour-du-monde-xo", "kentucky-owl-the-wiseman", "klipdrift-premium-brandy", "knappogue-castle-1951-vintage", "knappogue-castle-21-year-twin-wood", "knob-creek-9-year", "kwv-10-year-brandy", "kwv-15-year-brandy", "lagavulin-16-year", "lairds-applejack-brandy", "laphroaig-10-year", "larceny-barrel-proof-bourbon", "larceny-small-batch-bourbon", "louis-royer-xo-cognac", "macallan-12-double-cask", "macallan-12-sherry-oak", "macallan-18-double-cask", "macallan-1926-fine-rare-60-year", "macallan-25-year-double-cask", "macallan-30-year-double-cask", "macallan-40-year-double-cask", "macallan-50-year-in-lalique-crystal", "macallan-discovery-set", "macallan-the-reach-81-year", "makers-mark-46", "makers-mark-cask-strength", "makers-mark-cellar-aged", "makers-mark-original", "makers-mark-rc6-limited-release", "martell-assemblage-mathieu-gregoire", "martell-chanteloup-perspective", "martell-cohiba-edition", "martell-cordon-bleu", "martell-cordon-bleu-extra", "martell-creation-grand-extra", "martell-l-or-de-jean-martell", "martell-lor-de-jean-martell-baccarat-edition", "martell-vs-single-distillery", "martell-vsop-aged-in-red-barrels", "martell-xo", "michters-10-year-bourbon", "michters-20-year-bourbon", "michters-25-year-american-rye-pre-prohibition-era", "michters-25-year-bourbon", "michters-25-year-celebration-bourbon", "michters-25-year-celebration-bourbon-original-1970s", "michters-us1-bourbon", "michters-us1-rye", "midleton-silent-distillery-chapter-one", "midleton-very-rare-2014", "midleton-very-rare-2024", "midleton-very-rare-silent-distillery-chapter-four", "miguel-torres-gran-reserva-brandy", "monkey-shoulder-blended-malt", "nardini-grappa-riserva", "nikka-from-the-barrel", "nikka-single-malt-yoichi-20-year", "nikka-yoichi-1987-single-cask-35-year", "nikka-yoichi-50-year", "nonino-grappa-monovitigno", "oban-14-year", "oban-18-year", "oban-21-year", "oban-little-bay", "old-fitzgerald-19-year-bottled-in-bond", "old-fitzgerald-1954-bottled-in-bond-stitzel-weller", "old-forester-birthday-bourbon-2024", "oude-meester-brandy", "pappy-van-winkle-15-year", "pappy-van-winkle-20-year-family-reserve", "pappy-van-winkle-23-year-collector-edition", "pappy-van-winkle-23-year-family-reserve", "pappy-van-winkle-23-year-pre-fire-vintage-1990s", "parkers-heritage-27-year-promise-of-hope", "parkers-heritage-promise-of-hope-27-year-signed", "paul-masson-grande-amber-vs-brandy", "pierre-ferrand-10-generations", "pike-creek-21-year-double-barrel", "pike-creek-30-year-speyside-finish", "pisco-porton-mosto-verde", "port-ellen-1979-first-fill-sherry-40-year", "port-ellen-32-year-13th-release", "port-ellen-38-year-annual-release", "powers-johns-lane-28-year-single-cask-1993", "redbreast-12-year", "redbreast-21-year", "redbreast-27-year-cask-strength", "redbreast-32-year-cask-strength", "redbreast-32-year-dream-cask-tawny-port", "remy-martin-1738-accord-royal", "remy-martin-300-years-anniversary", "remy-martin-centaure-de-diamant", "remy-martin-club", "remy-martin-coeur-de-cognac", "remy-martin-louis-xiii", "remy-martin-louis-xiii-black-pearl", "remy-martin-louis-xiii-black-pearl-grande-champagne", "remy-martin-louis-xiii-rare-cask", "remy-martin-tercet", "remy-martin-vsop", "remy-martin-xo-excellence", "remy-martin-xo-limited-edition", "rittenhouse-rye-bib", "royal-salute-21-year", "royal-salute-25-year", "sazerac-18-year-1968-heritage-bottling", "sazerac-18-year-rye", "shelter-point-single-malt-10-year-cask-strength", "singleton-12-year", "singleton-15-year", "singleton-18-year", "springbank-1919-100-year", "springbank-21-year", "springbank-50-year", "stalk-barrel-single-malt-18-year", "stock-84-vsop-brandy", "suntory-royal-1960-original-bottling", "suntory-toki", "suntory-ultimate-collection-vault", "suntory-yamazaki-1984-single-cask", "talisker-10-year", "talisker-18-year", "talisker-25-year", "talisker-30-year", "talisker-storm", "tariquet-vsop-armagnac", "tariquet-xo-armagnac", "the-allocated-rarities-trio", "the-american-rye-masters-set", "the-bourbon-collectors-vault", "the-bourbon-foundations-set", "the-buffalo-trace-antique-collection", "the-collectors-ultimate-cellar", "the-dalmore-64-year-trinitas-presentation-set", "the-glenfiddich-century-vault", "the-glenfiddich-janet-sheed-roberts-reserve-1955-set", "the-irish-whiskey-trio", "the-islay-smoke-collection", "the-japanese-century-collection", "the-japanese-whisky-journey", "the-legendary-islay-vault", "the-macallan-masters-of-photography-ansel-adams-edition", "the-macallan-pinnacle-collection", "the-macallan-sherry-cask-journey", "the-pappy-family-legacy-collection", "the-pappy-van-winkle-experience", "the-rare-japanese-masters-set", "the-scotch-explorer-set", "the-speyside-masters-collection", "the-worlds-finest-whisky-box", "thomas-h-handy-sazerac-rye-2003-first-release", "tomatin-12-year", "tomatin-18-year", "torres-10-year-brandy", "torres-15-year-brandy", "torres-20-year-brandy", "torres-reserva-privada-1922-gran-reserva", "weller-full-proof-bourbon", "whistlepig-10-year", "whistlepig-15-year-vermont-estate-oak", "whistlepig-18-year-double-malt-rye", "whistlepig-boss-hog-spirit-of-mauve-special-edition", "whistlepig-farmstock-rye-crop-no003", "whistlepig-the-boss-hog-ix", "whistlepig-the-boss-hog-magellans-atlantic", "wild-turkey-101", "wild-turkey-rare-breed", "william-larue-weller-barrel-proof", "woodford-reserve-distillers-select", "woodford-reserve-double-oaked", "woodford-reserve-gift-set-with-glasses", "yamazaki-12-year", "yamazaki-18-year", "yamazaki-25-year", "yamazaki-35-year", "yamazaki-50-year", "yamazaki-55-year-2021-release"]);

/* A handful of product names don't reduce to their real slug via the general rule below \u2014
   the site's actual slugs were never generated by one single consistent algorithm, so these
   are pinned explicitly rather than chasing a "perfect" pattern that doesn't exist. */
var SLUG_OVERRIDES = {
  "D'USS\u00c9 Cabaret Edition": 'd-usse-cabaret-edition',
  "D'USS\u00c9 Limited Edition 750ml": 'd-usse-limited-edition-750ml',
  "D'USS\u00c9 V.S.O.P Cognac": 'd-usse-vsop-cognac',
  "D'USS\u00c9 XO Cognac": 'd-usse-xo-cognac',
  "Courvoisier L'Essence": 'courvoisier-l-essence',
  "Martell L'Or de Jean Martell": 'martell-l-or-de-jean-martell'
};
function makeProductSlug(name){
  if (SLUG_OVERRIDES[name]) return SLUG_OVERRIDES[name];
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'') /* \u00e9->e, \u00e8->e, \u00f4->o, etc. */
    .replace(/[''`'\u2019\u2018]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g,'')
    .trim().replace(/\s+/g,'-')
    .replace(/-+/g,'-').slice(0,80)
    .replace(/-$/,'');
}
function renderProducts(list,containerId){
  const el=document.getElementById(containerId);
  if(!el)return;
  el.innerHTML=list.map(p=>{
    const badge=p.badge?'<span class="pc-badge badge-'+p.badge+'">'+(p.badge==='hot'?'Hot':p.badge==='new'?'New':p.badge==='rare'?'Rare':'')+('</span>'):'';
    const slug=makeProductSlug(p.name);
    const hasPdp=(typeof CW_VALID_PDP!=='undefined')&&CW_VALID_PDP.has(slug);
    const pdpUrl='/products/'+slug+'.html';
    const priceStr=p.price>=1000?'$'+Math.round(p.price).toLocaleString('en-US'):'$'+Number(p.price).toFixed(2);
    const cryptoPrice=Math.round(p.price*0.90*100)/100;
    const cryptoStr=cryptoPrice>=1000?'$'+Math.round(cryptoPrice).toLocaleString('en-US'):'$'+cryptoPrice.toFixed(2);
    const pid=String(p.id);
    return '<div class="pc" data-pid="'+pid+'">'
      +(hasPdp?'<a href="'+pdpUrl+'" class="pc-img-link">':'<div class="pc-img-link" role="button" tabindex="0" style="cursor:pointer" onclick="openQV(\''+pid+'\')">')
        +'<div class="pc-img-wrap">'+badge+'<img src="'+p.img+'?v='+ASSET_V+'" alt="'+p.name+' — Premium Whisky at Caskworth" loading="lazy" onerror="this.onerror=null;this.src=\'/assets/images/placeholder.svg\'" width="220" height="280"></div>'
      +(hasPdp?'</a>':'</div>')
      +'<div class="pc-info">'
        +'<div class="pc-cat">'+p.cat+'</div>'
        +(hasPdp?'<a href="'+pdpUrl+'" class="pc-name-link"><div class="pc-name">'+p.name+'</div></a>':'<div class="pc-name-link" role="button" tabindex="0" style="cursor:pointer" onclick="openQV(\''+pid+'\')"><div class="pc-name">'+p.name+'</div></div>')
        +'<div class="pc-dist">'+p.dist+'</div>'
        +'<div class="pc-price">'+priceStr+'</div>'
        +'<div class="pc-crypto">&#127881; '+cryptoStr+' with crypto</div>'
        +'<div class="pc-btns">'
          +'<button class="pc-atc" type="button">Add to Cart</button>'
          +'<a href="'+pdpUrl+'" class="pc-view-btn" aria-label="Details — '+p.name+'">Details ↗</a>'
        +'</div>'
      +'</div></div>';
  }).join('');
  el.querySelectorAll('.pc-atc').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      var card=btn.closest('[data-pid]');
      if(!card)return;
      var rawId=card.getAttribute('data-pid');
      var id=(/^\d+$/.test(rawId))?Number(rawId):rawId;
      addToCart(id,1);
    });
  });
}
function filterTab(tag,btn,cid,pool){
  document.querySelectorAll('.ftab').forEach(t=>t.classList.remove('active'));
  if(btn)btn.classList.add('active');
  renderProducts(tag==='all'?pool:pool.filter(p=>p.tag===tag),cid);
}

let modalQty=1,currentModal=null;
function openQV(id){
  if(typeof PRODUCTS==='undefined'){loadCatalog(function(){openQV(id);});return;}
  const p=_findProduct(id);
  if(!p)return;
  currentModal=p;modalQty=1;
  const ov=document.getElementById('qv-overlay');
  if(!ov)return;
  const img=document.getElementById('qv-img');
  if(img){img.src=p.img+'?v='+ASSET_V;img.alt=p.name;img.onerror=()=>img.src='/assets/images/products/p'+p.id+'.png';}
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  const setI=(id,v)=>{const e=document.getElementById(id);if(e)e.innerHTML=v;};
  set('qv-cat',p.cat+(p.sub?' — '+p.sub:''));
  set('qv-name',p.name);
  set('qv-dist',p.dist+' · '+p.region);
  set('qv-abv',p.abv+'% ABV'+(p.age&&p.age!=='NAS'?' · '+p.age:''));
  set('qv-price','$'+p.price.toFixed(2));
  set('qv-desc',p.desc);
  setI('qv-notes',p.tasting.map(n=>`<span class="qv-chip">${n}</span>`).join(''));
  set('qv-qty-val',1);
  ov.classList.add('open');
  document.body.style.overflow='hidden';
}
function closeQV(){const ov=document.getElementById('qv-overlay');if(ov){ov.classList.remove('open');document.body.style.overflow='';}}
function qvQtyChange(d){modalQty=Math.max(1,modalQty+d);const e=document.getElementById('qv-qty-val');if(e)e.textContent=modalQty;}
function qvAddToCart(){if(currentModal){addToCart(currentModal.id,modalQty);closeQV();}}

/* ── Site search ─────────────────────────────────────────
   The panel markup is injected once at first use rather than duplicated into
   every page's HTML — this file is already loaded everywhere. */
function ensureSearchPanel(){
  if(document.getElementById('search-panel'))return;
  var ov=document.createElement('div');
  ov.id='search-overlay';
  ov.addEventListener('click',closeSearch);
  var panel=document.createElement('div');
  panel.id='search-panel';
  panel.innerHTML='<div class="search-panel-inner">'
    +'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
    +'<input type="search" id="search-input" placeholder="Search bourbon, Scotch, cognac, a distillery…" aria-label="Search products" autocomplete="off">'
    +'<button type="button" class="search-close" onclick="closeSearch()" aria-label="Close search">&times;</button>'
    +'</div><div class="search-hint">Press Enter to search the full catalogue</div>';
  document.body.appendChild(ov);
  document.body.appendChild(panel);
  var input=document.getElementById('search-input');
  input.addEventListener('keydown',function(e){
    if(e.key==='Enter')submitSearch();
    if(e.key==='Escape')closeSearch();
  });
}
function toggleSearch(){
  ensureSearchPanel();
  var ov=document.getElementById('search-overlay');
  var panel=document.getElementById('search-panel');
  var opening=!panel.classList.contains('open');
  ov.classList.toggle('open',opening);
  panel.classList.toggle('open',opening);
  if(opening){
    document.body.style.overflow='hidden';
    setTimeout(function(){document.getElementById('search-input').focus();},320);
  }else{
    document.body.style.overflow='';
  }
}
function closeSearch(){
  var ov=document.getElementById('search-overlay');
  var panel=document.getElementById('search-panel');
  if(ov)ov.classList.remove('open');
  if(panel)panel.classList.remove('open');
  document.body.style.overflow='';
}
function submitSearch(){
  var input=document.getElementById('search-input');
  var q=input?input.value.trim():'';
  if(!q){showToast('Type something to search for.');return;}
  window.location.href='/shop/?q='+encodeURIComponent(q);
}

function toggleCart(){
  document.getElementById('cart-overlay').classList.toggle('open');
  document.getElementById('cart-drawer').classList.toggle('open');
  renderCartItems();
}
function renderCartItems(){
  const body=document.getElementById('cart-body');
  const foot=document.getElementById('cart-foot');
  if(!body)return;
  if(cart.length===0){
    body.innerHTML=`<div class="cart-empty"><div class="icon">🛒</div><p>Your cart is empty.</p><a href="/shop/" class="btn btn-outline btn-sm" style="margin-top:8px;">Browse Whisky</a></div>`;
    if(foot)foot.style.display='none';return;
  }
  if(foot)foot.style.display='block';
  body.innerHTML=cart.map(item=>{
    const pid=String(item.id);
    return `<div class="cart-item" data-cid="${pid}">
    <img class="ci-img" src="${item.img}?v=${ASSET_V}" alt="${item.name} — Caskworth" loading="lazy" onerror="this.onerror=null;this.src='/assets/images/placeholder.svg'" width="64" height="80">
    <div class="ci-info">
      <div class="ci-name">${item.name.substring(0,36)}</div>
      <div class="ci-price">$${(item.price*item.qty).toFixed(2)}</div>
      <div class="ci-qty">
        <button class="ci-minus" type="button">−</button>
        <span>${item.qty}</span>
        <button class="ci-plus" type="button">+</button>
        <button class="ci-rm" type="button" style="background:none;border:none;color:var(--muted);cursor:pointer;margin-left:4px;font-size:11px;padding:0;">✕ Remove</button>
      </div>
    </div>
  </div>`;
  }).join('');
  // Attach cart item handlers safely — no inline onclick quoting issues
  body.querySelectorAll('.ci-minus').forEach(function(btn){
    btn.addEventListener('click',function(){
      var id=_rawIdFromCartEl(btn);
      if(id!==null)cartQty(id,-1);
    });
  });
  body.querySelectorAll('.ci-plus').forEach(function(btn){
    btn.addEventListener('click',function(){
      var id=_rawIdFromCartEl(btn);
      if(id!==null)cartQty(id,1);
    });
  });
  body.querySelectorAll('.ci-rm').forEach(function(btn){
    btn.addEventListener('click',function(){
      var id=_rawIdFromCartEl(btn);
      if(id!==null)cartRemove(id);
    });
  });
  const sub=getSubtotal();
  const warn=sub<MIN_ORDER?`<div class="min-warn">Minimum order $${MIN_ORDER}. Add $${(MIN_ORDER-sub).toFixed(2)} more.</div>`:'';
  const subtotalEl=document.getElementById('cart-subtotal');
  if(subtotalEl)subtotalEl.textContent='$'+sub.toFixed(2);
  const warnEl=document.getElementById('cart-warn');
  if(warnEl)warnEl.innerHTML=warn;
  const cbtn=document.getElementById('cart-co-btn');
  if(cbtn){cbtn.disabled=false;cbtn.style.opacity='1';}
}
function _rawIdFromCartEl(el){
  var item=el.closest('[data-cid]');
  if(!item)return null;
  var raw=item.getAttribute('data-cid');
  return (/^\d+$/.test(raw))?Number(raw):raw;
}
function goCheckout(){if(getSubtotal()<MIN_ORDER){showToast('Minimum order $'+MIN_ORDER+' USD');return;}window.location.href='/checkout/';}

function toggleNav(){
  const n=document.getElementById('mob-nav');
  if(!n)return;
  n.classList.toggle('open');
  document.body.style.overflow=n.classList.contains('open')?'hidden':'';
}

function checkAge(){if(sessionStorage.getItem('cw_age')){const ag=document.getElementById('age-gate');if(ag)ag.style.display='none';}}
function confirmAge(){sessionStorage.setItem('cw_age','1');const ag=document.getElementById('age-gate');if(ag){ag.style.opacity='0';ag.style.transition='opacity .3s';setTimeout(()=>ag.style.display='none',300);}}
function denyAge(){window.location.href='https://www.responsibility.org/';}

let toastTimer;
function showToast(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2800);}

function toggleFaq(el){
  const item=el.closest('.faq-item');
  const isOpen=item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i=>i.classList.remove('open'));
  if(!isOpen)item.classList.add('open');
}

function initHeaderScroll(){
  const h=document.getElementById('site-header');
  if(!h)return;
  window.addEventListener('scroll',()=>{h.classList.toggle('scrolled',window.scrollY>10);},{passive:true});
}

function initVerifyBadge(){
  var badge=document.createElement('a');
  badge.href='https://bizfileonline.sos.ca.gov/search/business';
  badge.target='_blank';
  badge.rel='noopener noreferrer';
  badge.className='verify-badge';
  badge.title='Caskworth is operated by 49er Liquors Inc, a licensed California corporation (Entity No. 5373948). Click to verify with the California Secretary of State.';
  badge.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/></svg><span class="vb-text"><span class="vb-line1"><span class="vb-full">CA Licensed Corp</span><span class="vb-short">Verified</span></span><span class="vb-line2"><span class="vb-full">49er Liquors Inc &middot; Entity #5373948</span><span class="vb-short">Entity #5373948</span></span></span>';
  var bar=document.getElementById('announce-bar');
  if(bar){
    bar.insertBefore(badge,bar.firstChild);
  }else{
    var header=document.getElementById('site-header');
    if(header&&header.parentNode){
      var slim=document.createElement('div');
      slim.id='verify-bar';
      slim.appendChild(badge);
      header.parentNode.insertBefore(slim,header);
    }
  }
}

function initReveal(){
  const obs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:.1,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}

function initHeroSlider(){
  const slider=document.getElementById('hero-slider');
  if(!slider)return;
  const slides=[...slider.querySelectorAll('.hero-slide')];
  const dots=[...slider.querySelectorAll('.hero-dot')];
  if(slides.length<2)return;
  let idx=0,timer=null;
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(i){
    idx=(i+slides.length)%slides.length;
    slides.forEach((s,n)=>s.classList.toggle('active',n===idx));
    dots.forEach((d,n)=>{
      d.classList.toggle('active',n===idx);
      d.setAttribute('aria-selected',n===idx?'true':'false');
    });
  }
  function next(){show(idx+1);}
  function stop(){if(timer){clearInterval(timer);timer=null;}}
  function start(){if(reduceMotion)return;stop();timer=setInterval(next,5500);}

  window.heroGoTo=function(i){show(i);start();};

  slider.addEventListener('mouseenter',stop);
  slider.addEventListener('mouseleave',start);
  slider.addEventListener('focusin',stop);
  slider.addEventListener('focusout',start);

  start();
}

function subscribeNl(e){
  e.preventDefault();
  const inp=document.getElementById('nl-email');
  if(!inp||!inp.value.includes('@')){showToast('Please enter a valid email.');return;}
  showToast('✓ Subscribed! Welcome to Caskworth.');
  inp.value='';
}

function initCryptoTabs(){
  const tabs=document.querySelectorAll('.ctab');
  tabs.forEach(tab=>{
    tab.addEventListener('click',()=>{
      tabs.forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      const walletId=tab.dataset.wallet;
      showWallet(walletId);
    });
  });
  if(tabs.length>0){tabs[0].classList.add('active');showWallet(tabs[0].dataset.wallet);}
}
function showWallet(walletId){
  const wallet=WALLETS.find(w=>w.id===walletId);
  if(!wallet)return;
  const addrEl=document.getElementById('crypto-address');
  const networkEl=document.getElementById('crypto-network');
  const qrEl=document.getElementById('qr-container');
  if(addrEl)addrEl.textContent=wallet.addr;
  if(networkEl)networkEl.textContent='Network: '+wallet.network;
  if(qrEl&&window.QRCode){
    qrEl.innerHTML='';
    new QRCode(qrEl,{text:wallet.addr,width:140,height:140,colorDark:'#1c1c1e',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
  }
}
function selectPayMethod(method,el){
  currentPayMethod = method;
  updateOrderSummaryDisplay(method);
  document.querySelectorAll('.pay-method').forEach(m=>m.classList.remove('selected'));
  if(el)el.classList.add('selected');
  document.querySelectorAll('.crypto-panel,.other-panel').forEach(p=>p.classList.remove('active'));
  const panel=document.getElementById('panel-'+method);
  if(panel)panel.classList.add('active');
}
function renderCheckoutSummary(){
  const itemsEl=document.getElementById('ob-items');
  if(!itemsEl)return;
  if(!cart||cart.length===0){
    itemsEl.innerHTML='<div style="font-size:12px;color:var(--muted)">Cart is empty. <a href="/shop/" style="color:var(--gold)">Shop</a></div>';
  } else {
    itemsEl.innerHTML=cart.map(i=>`<div class="ob-item"><span>${i.name.substring(0,28)} ×${i.qty}</span><span>$${(i.price*i.qty).toFixed(2)}</span></div>`).join('');
  }
  updateCryptoDiscount();
}

document.addEventListener('DOMContentLoaded',()=>{
  loadCart();if(typeof checkAge==="function")checkAge();updateCartUI();initReveal();initHeaderScroll();initHeroSlider();initVerifyBadge();
  const qvOv=document.getElementById('qv-overlay');
  if(qvOv)qvOv.addEventListener('click',e=>{if(e.target===qvOv)closeQV();});
  const cOv=document.getElementById('cart-overlay');
  if(cOv)cOv.addEventListener('click',toggleCart);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeQV();closeSearch();const n=document.getElementById('mob-nav');if(n&&n.classList.contains('open'))toggleNav();}});
  if(typeof initCryptoTabs==='function'&&document.querySelector('.ctab'))initCryptoTabs();
  if(typeof renderCheckoutSummary==='function')renderCheckoutSummary();
});

// passive-event-patch — improves mobile scroll performance (Lighthouse)
(function(){
  var _sup = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, fn, opts){
    if(type === 'touchstart' || type === 'touchmove' ||
       type === 'wheel'      || type === 'mousewheel'){
      if(typeof opts === 'boolean' || opts === undefined || opts === null){
        opts = {passive: true, capture: !!opts};
      } else if(typeof opts === 'object' && opts.passive === undefined){
        opts = Object.assign({}, opts, {passive: true});
      }
    }
    return _sup.call(this, type, fn, opts);
  };
})();
