Events.on(ContentInitEvent, e =>
  {
    init_random();
    Vars.content.planet("dark_planets-dapl_main").generator = new SerpuloPlanetGenertor();
  })
var dapl_main_gen = extenc(SerpuloPlanetGenerator,{});

var floor_0_tiles = [Blocks.magmarock,Blocks.hotrock,Blocks.basalt]; // to insert core zone at random. 
var floor_1_tiles = [Blocks.watar, Blocks.darksandWater, Blocks.darksand];
var floor_stones = [];

function init_random(){}
function generate_tile_system(){} 
