Events.on(ContentInitEvent, e =>
  {
    init_random();
    Vars.content.planet("dark_planets-dapl_main").sectorSeed = Math.floor(Math.random() * 999999999);
    Vars.content.planet("dark_planets-dapl_main").meshLoader = new HexMesh(Vars.content.planet("dark_planets-dapl_main"),new HexMesher(0),9);
    Vars.content.planet("dark_planets-dapl_main").generator = new SerpuloPlanetGenerator();
  })
var dapl_main_gen = extenc(SerpuloPlanetGenerator,
{
getColor(po,co){var bl = this.getBlock(po); if(bl == Blocks.salt) bl = Blocks.sand; co.set(block.mapColor).a(1 - bl.albedo);},  
rawHeight(po){return (Mathf.pow(Simplex.noise3d(seed, 7, 0.5, 0.34, position.x * scl, position.y * scl + heightYOffset, position.z * scl) * heightScl, 2.3) + wos) / (1 + wos);},
  
});
var floors_arky = [Blocks.arkyciteFloor, Blocks.arkyicStone, Blocks.BeryllicStone]
var floors_volc = [Block.slag,Blocks.magmarock,Blocks.hotrock,Blocks.basalt]; // to insert core zone at random. 
var floors_wdar = [Blocks.watar, Blocks.darksandWater, Blocks.darksand];
var floors_wlig = [Blocks.water, Blocks.sandwater, Blocks.sand];
var floors_spor = [Blocks.sporeMoss, Blocks.moss, Blocks.redStone];
var floors_cold = [Blocks.ice,Blocks.iceSnow,Blocks.snow]; 

function get_block()
{
    return Blocks.coreZone;
}

var total_ties =[]; 
var wos = 0.07

function init_random(){wos = Math.random()* 0.15;}
function generate_tile_system(){} 
