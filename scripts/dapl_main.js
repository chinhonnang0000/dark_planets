Events.on(ContentInitEvent, e =>
  {
    this_pl = Vars.content.planet("dark_planets-dapl_main");
    init_random();
    this_pl.generator = dapl_main_gen; 
    this_pl.lightSrcTo = 0.01;
  })
var dapl_main_gen = extend(SerpuloPlanetGenerator,{});
var floors_arky = [Blocks.BeryllicStone,Blocks.arkyicStone,Blocks.arkyciteFloor, Blocks.arkyicStone, Blocks.BeryllicStone];
var floors_volc = [Blokss.dacite,Blocks.basalt,Blocks.hotrock,Blocks.magmarock,Block.slag,Blocks.magmarock,Blocks.hotrock,Blocks.basalt,Blokss.dacite]; // to insert core zone at random. 
var floors_wdar = [Blocks.darksandWater,Blocks.darksand,Blocks.watar, Blocks.darksandWater, Blocks.darksand];
var floors_wlig = [Blocks.sand,Blocks.sandwater,Blocks.water, Blocks.sandwater, Blocks.sand];
var floors_spor = [Blocks.moss,Blocks.sporeMoss, Blocks.moss];
var floors_oils = [Blocks.shale,Blocks.oil,Blocks.shale];
var floors_cold = [Blocks.snow,Blocks.iceSnow,Blocks.ice,Blocks.iceSnow,Blocks.snow]; 

var floor_levels; 
var hs1,hs2; 
var ore_scl1,ore_scl2;
var ocu = 0.31; 
var pwr1; 
var sclh,sclr,sclx,scly,sclz; 
var sed_main = Math.floor(Math.random() * 999999999;)
var this_pl;
var total_tiles =[]; 
var wos = 0.07;

function get_block(po)
{
  var height = raw_height(po) * 1.2;
  var px = position.x * sclx, py = position.y * scly, pz = position.z * sclz;
  var temp = Mathf.clamp(Math.abs(py * 2) / sclr);
  var tnoise = Simplex.noise3d(seed, 7, 0.56, 0.33, px, py + 999 - 0.1, pz);
  temp = Mathf.lerp(temp, tnoise, 0.5);
  height = Mathf.clamp(height);
  var res = get_tile(Mathf.clamp(temp * floor_levels,0,floor_levels-1),Mathf.clamp(height * floor_levels,0,floor_levels-1)); 
  return res;
}

function get_tile(a,b)
{
  var c = Math.floor(a); var d = Math.floor(b);
  if(total_tiles[c][d] == null) return Blocks.coreZone;
  if(c >=0 && d >= 0){return total_tiles[c][d];}
  return Blocks.coreZone;
}
function get_random_tile()
{
  var a = Math.floor(Math.random() * 9);
  switch(a)
  {
    case 0: return Blocks.ferricStone; 
    case 1: return Blocks.redStone;
    case 2: return Blocks.denseRedStone;
    case 3: return Blocks.rhyolite;
    case 4: return Blocks.roughRhyolite;
    case 5: return Blocks.stone; 
    case 7: return Blocks.coreZone;
    case 8: return Blocks.carbonStone; 
  }
  return Blocks.coreZone; 
}

function get_random_tile_group()
{
  var a = Math.floor(Math.random() * 7);
  switch (a){
    case 0: return floors_arky;
    case 1: return floors_volc;
    case 2: return floors_wdar;
    case 3: return floors_wlig;
    case 4: return floors_spor;
    case 5: return floors_oils;
    case 6: return floors_cold;
  }
  return [Blocks.coreZone,Blocks.coreZone,Blocks.coreZone]; 
}

function init_random()
{
  wos = Math.random()* 0.15;  
  this_pl.sectorSeed = Math.floor(Math.random() * 999999999);
  hs1 = Math.random(); hs2 = Math.random(); 
  pwr1 = Math.random() * 4.5; 
  sclh = 0.8 + Math.random() * 0.42;  
  sclr = 5 * Math.pow(2,Math.random());
  sclx = 5 * Math.pow(2,Math.random()); scly = 5 * Math.pow(2,Math.random());  sclz = 5 * Math.pow(2,Math.random());
  sed_main = Math.floor(Math.random() * 999999999;
  floor_levels = 20 + Math.floor(Math.random() * 50);
  ore_scl1 = 40 + Math.random() * 100; ore_scl2 = 30 + Math.random() * 75;
  ocu = Math.random() * 0.6; 

  generate_tile_system();
}
function generate_tile_system()
{
  total_tiles = new Array(); 
  var a = 0; var b =0; while(a < floor_levels)
    {
       total_tiles[a] = new Array();
      total_tiles[a].concat(get_random_tile_group()); total_tiles[a].push(get_random_tile())
      b =0; while (b < floor_levels/4)
      {
        total_tiles[a].concat(get_random_tile_group()); total_tiles[a].push(get_random_tile());
        b = b+1; 
      }
      a =a+1; 
    }
} 

function rawH_height(po){return (Mathf.pow(Simplex.noise3d(sed_main, 7, hs1, hs2, position.x * sclx, position.y * scly + heightYOffset, position.z * sclz) * sclh, pwr1) + wos) / (1 + wos);},
