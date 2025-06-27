Events.on(ContentInitEvent, e =>
  {
    init_random();
    Vars.content.planet("dark_planets-dapl_main").generator = new SerpuloPlanetGenerator();
  })
var dapl_main_gen = extenc(SerpuloPlanetGenerator,
{
                             
});
var floors_arky = [Blocks.arkyciteFloor, Blocks.arkyicStone, Blocks.BeryllicStone]
var floors_volc = [Block.slag,Blocks.magmarock,Blocks.hotrock,Blocks.basalt]; // to insert core zone at random. 
var floors_wdar = [Blocks.watar, Blocks.darksandWater, Blocks.darksand];
var floors_wlig = [Blocks.water, Blocks.sandwater, Blocks.sand];
var floors_spor = [Blocks.sporeMoss, Blocks.moss, Blocks.redStone];
var floors_cold = [Blocks.ice,Blocks.iceSnow,Blocks.snow]; 

var total_ties =[]; 

function init_random(){}
function generate_tile_system(){} 
