Events.on(ContentInitEvent, e =>
  {
    this_pl = Vars.content.planet("dark_planets-dapl_main");
    init_random();
    this_pl.generator = dapl_main_gen; 
    this_pl.lightSrcTo = 0.01;
  })
var dapl_main_gen = extend(SerpuloPlanetGenerator,
{

getColor(po,co){var bl = this.getBlock(po); if(bl == Blocks.salt) bl = Blocks.sand; co.set(block.mapColor).a(1 - bl.albedo);},  
generate(ti,se)
{
  init_random();
   this.tiles = ti; this.sector = se ; 
      const rand = this.rand; rand.setSeed(se.id+ Math.floor(Math.random() * 999999999));

       //tile, sector
       var gen = new TileGen();
       this.tiles.each((x, y) => {
           gen.reset();
           var position = this.sector.rect.project(x / ti.width, y / ti.height);

           this.genTile(position, gen);
           ti.set(x, y, new Tile(x, y, gen.floor, gen.overlay, gen.block));
       });
       
       const Room = {
           x: 0, y: 0, radius: 0,
           connected: new ObjectSet(),

           connect(to){
               if(this.connected.contains(to)) return;

               this.connected.add(to);
               
               var nscl = rand.random(20, 60);
               var stroke = rand.random(4, 12);
               
               dapl_main_gen.brush(dapl_main_gen.pathfind(this.x, this.y, to.x, to.y, tile => (tile.solid() ? 5 : 0) + 
               dapl_main_gen.noiseOct(tile.x, tile.y, 1, 1, 1 / nscl) * 60, Astar.manhattan), stroke);
           }
       };
       
       const setRoom = (x, y, radius) => {
           var room = Object.create(Room);
           room.x = x;    room.y = y;
           room.radius = radius * (1 + Math.random());
           return room;
       };

       this.cells(4);    this.distort(10, 12);
       this.width = this.tiles.width;    this.height = this.tiles.height;
       var constraint = 1.3;
       var radius = this.width / 2 
       var rooms = rand.random(2, 5);
       var roomseq = new Seq();

       for(var i = 0; i < rooms; i++){
           Tmp.v1.trns(rand.random(360), rand.random(radius / constraint));
           var rx = Math.floor(this.width / 2 + Tmp.v1.x);
           var ry = Math.floor(this.height / 2 + Tmp.v1.y);
           var maxrad = radius - Tmp.v1.len();
           var rrad = Math.floor(Math.min(rand.random(9, maxrad / 2), 30));
           roomseq.add(setRoom(rx, ry, rrad));
       };

       var spawn = null;
       var enemies = new Seq();
       var enemySpawns = rand.random(1, Math.max(Mathf.floor(this.sector.threat * 4), 1));
       
       var offset = rand.nextInt(360);
       var length = this.width / 2.55 - rand.random(13, 23);
       var angleStep = 5;
       var waterCheckRad = 5;
       
       for(var i = 0; i < 360; i += angleStep){
           var angle = offset + i;
           var cx = Math.floor(this.width / 2 + Angles.trnsx(angle, length));
           var cy = Math.floor(this.height / 2 + Angles.trnsy(angle, length));

           var waterTiles = 0;

           for(var rx = -waterCheckRad; rx <= waterCheckRad; rx++){
               for(var ry = -waterCheckRad; ry <= waterCheckRad; ry++){
                   var tile = this.tiles.get(cx + rx, cy + ry);
                   if(tile == null || tile.floor().liquidDrop != null){waterTiles++;};
               };
           };

           if(waterTiles <= 4 || (i + angleStep >= 360)){
               spawn = setRoom(cx, cy, rand.random(10, 18));
               roomseq.add(spawn);

               for(var j = 0; j < enemySpawns; j++){
                   var enemyOffset = rand.range(60);
                   
                   Tmp.v1.set(cx - this.width / 2, cy - this.height / 2).rotate(180 + enemyOffset).add(this.width / 2, this.height / 2);
                   var espawn = setRoom(Math.floor(Tmp.v1.x), Math.floor(Tmp.v1.y), rand.random(10, 16));
                   roomseq.add(espawn); enemies.add(espawn);
               };

               break;
           };
       };

       roomseq.each(room => this.erase(room.x, room.y, room.radius));
       var connections = rand.random(Math.max(rooms - 1, 1), rooms + 3);
       for(var i = 0; i < connections; i++){roomseq.random(rand).connect(roomseq.random(rand));};
       roomseq.each(room => spawn.connect(room));

       this.cells(1);
       this.distort(10, 6);
       this.inverseFloodFill(this.tiles.getn(spawn.x, spawn.y));
       var poles = Math.abs(this.sector.tile.v.y);
       var nmag = 0.5; var scl = 5 + Math.random() * 5;
       var addscl = 1.3;
       
       var ores = Seq.with(Blocks.oreScrap);
       ores.add(Blocks.oreCoal);ores.add(Blocks.oreCopper); ores.add(Blocks.oreLead); // basic Serpulo
       ores.add(Blocks.wallOreBeryllium);ores.add(Blocks.wallOreTungsten); // basic Erekir. 
       if(Simplex.noise3d(1, 2, 0.5, scl, this.sector.tile.v.x, this.sector.tile.v.y, this.sector.tile.v.z) * nmag + poles > 0.5 * addscl){ores.add(Blocks.wallOreThorium);};
       if(Simplex.noise3d(1, 2, 0.5, scl, this.sector.tile.v.x + 1, this.sector.tile.v.y, this.sector.tile.v.z) * nmag + poles > 0.2 * addscl){ores.add(Blocks.oreTitanium);};

       var frequencies = new FloatSeq();
       for(var i = 0; i < ores.size; i++){
           frequencies.add(rand.random(-0.1, 0.01) - i * 0.01 + poles * 0.04);
       };

       this.pass((x, y) => {
           if(!this.floor.asFloor().hasSurface()) return;

           var offsetX = x - 4, offsetY = y + 23;
           for(var i = ores.size - 1; i >= 0; i--){
               var entry = ores.get(i);
               var freq = frequencies.get(i);
               
               if(Math.abs(0.5 - this.noiseOct(offsetX, offsetY + i * 999, 1, 0.1, (ore_scl1 + i))) > 0.2 + i * 0.01 &&
                   Math.abs(0.5 - this.noiseOct(offsetX, offsetY - i * 999, 1, 0.1, (ore_scl2 + i))) > 0.3 + freq){
                   this.ore = entry;
                   break;
               };    
           };
           if(this.ore == Blocks.oreScrap && rand.chance(0.33)){this.floor = Blocks.coreZone;};
       });
       var difficulty = this.sector.threat;
       const ints = this.ints;
        
        ints.clear();
        ints.ensureCapacity(this.width * this.height / 4);

        Schematics.placeLaunchLoadout(spawn.x, spawn.y);
        enemies.each(espawn => this.tiles.getn(espawn.x, espawn.y).setOverlay(Blocks.spawn));
        var state = Vars.state;
        if(this.sector.hasEnemyBase()){
            this.basegen.generate(tiles, enemies.map(r => this.tiles.getn(r.x, r.y)), this.tiles.get(spawn.x, spawn.y), state.rules.waveTeam, this.sector, difficulty);
            state.rules.attackMode = this.sector.info.attack = true;
        }else{
            state.rules.winWave = this.sector.info.winWave = 10 + 5 * Math.max(difficulty * 10, 1);
        };

        var waveTimeDec = 0.4; 

        state.rules.waveSpacing = Mathf.lerp(60 * 130, 3600, Math.floor(Math.max(difficulty - waveTimeDec, 0) / 0.8));
        state.rules.waves = this.sector.info.waves = true;
        state.rules.enemyCoreBuildRadius = 480;
        state.rules.spawns = Waves.generate(difficulty, new Rand(), state.rules.attackMode);
},
genTile(po,ti)
{
  ti.floor = get_block(po);
  if(Ridged.noise3d(seed + 1, po.x, po.y, po.z, 2, 22) > ocu){tile.block = Blocks.air;}
},
noiseOct(x, y, octaves, falloff, scl){
    var v = this.sector.rect.project(x, y).scl(5);
    return Simplex.noise3d(1, octaves, falloff, 0.4/scl, v.x, v.y, v.z);
}
});
var floors_arky = [Blocks.BeryllicStone,Blocks.arkyicStone,Blocks.arkyciteFloor, Blocks.arkyicStone, Blocks.BeryllicStone];
var floors_volc = [Blokss.dacite,Blocks.basalt,Blocks.hotrock,Blocks.magmarock,Block.slag,Blocks.magmarock,Blocks.hotrock,Blocks.basalt,Blokss.dacite]; // to insert core zone at random. 
var floors_wdar = [Blocks.darksandWater,Blocks.darksand,Blocks.watar, Blocks.darksandWater, Blocks.darksand];
var floors_wlig = [Blocks.sand,Blocks.sandwater,Blocks.water, Blocks.sandwater, Blocks.sand];
var floors_spor = [Blocks.moss,Blocks.sporeMoss, Blocks.moss];
var floors_oils = [Blocks.shale,Blocks.oil,Blocks.shale];
var floors_cold = [Blocks.snow,Blocks.iceSnow,Blocks.ice,Blocks.iceSnow,Blocks.snow]; 

var floor_levels; 
var ore_scl1,ore_scl2;
var ocu = 0.31; 
var rh_seed, rh_sclh, rh_powe;
var sclr,sclx,scly,sclz; 
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
  rh_seed = Math.floor(Math.random() * 999999999); rh_sclh = 0.8 + Math.random() * 0.4; rh_powe = Math.random() * 4.5; 
  sclr = 5 * Math.pow(2,Math.random());
  sclx = 5 * Math.pow(2,Math.random());  scly = 5 * Math.pow(2,Math.random());  sclz = 5 * Math.pow(2,Math.random());
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

function raw_height(po){return (Math.pow(Simplex.noise3d(rh_seed, 7, 0.5, 0.34, position.x * sclx, position.y * scly + heightYOffset, position.z * sclz) * rh_sclh, rh_powe) + wos) / (1 + wos);}
