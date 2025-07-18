Events.on(ContentInitEvent, e =>
  {
    this_pl = Vars.content.planet("dark_planets-dapl_main");
    init_random();
    this_pl.generator = dapl_main_gen; 
    //this_pl.lightSrcTo = 0.01; // disabled for tilegen evaluating purpose 
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
       var rooms = rand.random(3, 9);
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
       for(var i = 0; i < ores.size; i++){frequencies.add(rand.random(-0.1, 0.01) - i * 0.01 + poles * 0.04);};

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
  ti.block = ti.floor.asFloor().wall;
  if(Ridged.noise3d(gt_seed + 1, po.x, po.y, po.z, 2, gt_scal) > ocu){ti.block = Blocks.air;}
  if(ti.block == Blocks.air && Math.random() < 0.03){ti.block = ti.floor.asFloor().decoration;}
  
   if(ti.floor == Blocks.arkyicStone && Simplex.noise3d(seed_vark,1,0,dist_vark,po.x,po.y,po.z) > 0.75){ti.floor = Blocks.arkyicVent; ti.block = Blocks.air;}
   else if(ti.floor == Blocks.carbonStone && Simplex.noise3d(seed_vcar,1,0,dist_vcar,po.x,po.y,po.z) > 0.75){ti.floor = Blocks.carbonVent; ti.block = Blocks.air;}
   else if(ti.floor == Blocks.crystallineStone && Simplex.noise3d(seed_vcry,1,0,dist_vcry,po.x,po.y,po.z) > 0.75){ti.floor = Blocks.crystallineVent; ti.block = Blocks.air;}
   else if(ti.floor == Blocks.redStone && Simplex.noise3d(seed_vred,1,0,dist_vred,po.x,po.y,po.z) > 0.75){ti.floor = Blocks.redStoneVent; ti.block = Blocks.air;}
   else if(ti.floor == Blocks.rhyolite && Simplex.noise3d(seed_vrhy,1,0,dist_vrhy,po.x,po.y,po.z) > 0.75){ti.floor = Blocks.rhyoliteVent; ti.block = Blocks.air;}
   else if(ti.floor == Blocks.yellowStone && Simplex.noise3d(seed_vyel,1,0,dist_vyel,po.x,po.y,po.z) > 0.75){ti.floor = Blocks.yellowStoneVent; ti.block = Blocks.air;}

},
noiseOct(x, y, octaves, falloff, scl){
    var v = this.sector.rect.project(x, y).scl(5);
    return Simplex.noise3d(1, octaves, falloff, 0.4/scl, v.x, v.y, v.z);
}
});

var floor_levels; 
var dist_bery, dist_coal, dist_copp, dist_lead, dist_tung; //common resources
var dist_vark, dist_vcry, dist_vcar, dist_vred, dist_vrhy, dist_vyel; 
var seed_bery, seed_coal, seed_copp, seed_lead, seed_tung;
var seed_vark, seed_vcry, seed_vcar, seed_vred, seed_vrhy, seed_vyel; 
var gt_seed, gt_scal; 
var ore_scl1,ore_scl2;
var ocu = 0.31; 
var rh_seed, rh_sclh, rh_powe, rh_yofs;
var sclr,sclx,scly,sclz; 
var this_pl;
var total_tiles =[]; 
var wos = 0.07;

function get_block(po)
{
  var height = raw_height(po) * 1.2;
  var px = po.x * sclx, py = po.y * scly, pz = po.z * sclz;
  var temp = Mathf.clamp(Math.abs(py * 2) / sclr);
  var tnoise = Simplex.noise3d(rh_seed, 7, 0.56, 0.33, px, py + 999 - 0.1, pz);
  temp = Mathf.lerp(temp, tnoise, 0.5);
  height = Mathf.clamp(height);
  var res = get_tile(Math.abs(Mathf.clamp(temp * 12,0,11)),Math.abs(Mathf.clamp(height * floor_levels,0,floor_levels-1))); 
  return res;
}

function get_tile(a,b)
{
  var c = Math.floor(a); var d = Math.floor(b); // bugs: undefined blocks detected. 
  if(total_tiles[c][d] == null) {return Blocks.carbonVent;}
  return total_tiles[c][d]
}
function get_random_tile()
{
  var a = Math.floor(Math.random() * 9.99);
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
    case 9: return Blocks.yellowStone; 
  }
  return Blocks.coreZone; 
}

function init_random()
{
  gt_seed = Math.floor(Math.random() * 999999999); gt_scal = 20 * Math.pow(2,Math.random()); 
  wos = Math.random()* 0.15;  
  this_pl.sectorSeed = Math.floor(Math.random() * 999999999);
  rh_seed = Math.floor(Math.random() * 999999999); rh_sclh = 1+ Math.random(); rh_powe = Math.random() * 3; rh_yofs = Math.random() * 95;
  sclr = 5 * Math.pow(2,Math.random());
  sclx = 5 * Math.pow(2,Math.random());  scly = 5 * Math.pow(2,Math.random());  sclz = 5 * Math.pow(2,Math.random());
  floor_levels = 20 + Math.floor(Math.random() * 50);
  ore_scl1 = 40 + Math.random() * 100; ore_scl2 = 30 + Math.random() * 75;
  ocu = Math.random() * 0.6; 

  dist_bery = 40 + Math.random() * 20; seed_bery = Math.floor(Math.random() * 999999999); // erekir stuff
  dist_coal = 40 + Math.random() * 20; seed_coal = Math.floor(Math.random() * 999999999);
  dist_copp = 40 + Math.random() * 20; seed_copp = Math.floor(Math.random() * 999999999);
  dist_lead = 40 + Math.random() * 20; seed_lead = Math.floor(Math.random() * 999999999);
  dist_tung = 40 + Math.random() * 20; seed_tung = Math.floor(Math.random() * 999999999); // erekir stuff. 
  dist_vark = 90 + Math.random() * 20; seed_vark = Math.floor(Math.random() * 999999999); 
  dist_vcar = 90 + Math.random() * 20; seed_vcar = Math.floor(Math.random() * 999999999); 
  dist_vcry = 90 + Math.random() * 20; seed_vcry = Math.floor(Math.random() * 999999999); 
  dist_vred = 90 + Math.random() * 20; seed_vred = Math.floor(Math.random() * 999999999); 
  dist_vrhy = 90 + Math.random() * 20; seed_vrhy = Math.floor(Math.random() * 999999999); 
  dist_vyel = 90 + Math.random() * 20; seed_vyel = Math.floor(Math.random() * 999999999); 

  generate_tile_system();
}
function generate_tile_system()
{
  total_tiles = new Array(); 
  var a = 0; var b =0; while(a < 12)
    {
       total_tiles[a] = new Array();
       total_tiles[a].push(Blocks.slag); total_tiles[a].push(Blocks.magmarock); total_tiles[a].push(Blocks.hotrock); total_tiles[a].push(Blocks.basalt); total_tiles[a].push(Blocks.dacite);  
       total_tiles[a].push(get_random_tile());
      b =0; while (b < floor_levels)
      {
        var c = Math.floor(Math.random() * 6.999);
        switch(c)
        {
          case 0: total_tiles[a].push(Blocks.beryllicStone); total_tiles[a].push(Blocks.arkyicStone); total_tiles[a].push(Blocks.arkyciteFloor); total_tiles[a].push(Blocks.arkyicStone); total_tiles[a].push(Blocks.beryllicStone);b = b+5; break;
          case 1: total_tiles[a].push(Blocks.shale); total_tiles[a].push(Blocks.tar); total_tiles[a].push(Blocks.shale); b = b+3; break; 
          case 2: total_tiles[a].push(Blocks.darksand); total_tiles[a].push(Blocks.darksandWater); total_tiles[a].push(Blocks.darksand); b = b+3; break; 
          case 4: total_tiles[a].push(Blocks.moss); total_tiles[a].push(Blocks.sporeMoss); total_tiles[a].push(Blocks.moss); b = b+3; break; 
          case 5: total_tiles[a].push(Blocks.snow); total_tiles[a].push(Blocks.iceSnow); total_tiles[a].push(Blocks.ice); total_tiles[a].push(Blocks.iceSnow); total_tiles[a].push(Blocks.snow); b = b+5; break; 
          case 6: total_tiles[a].push(Blocks.crystallineStone); total_tiles[a].push(Blocks.crystalFloor); total_tiles[a].push(Blocks.crystallineStone); b = b+3; break; 
        }
        total_tiles[a].push(get_random_tile());
        b = b+1; 
      }
      a =a+1; 
    }
} 

function raw_height(po){return (Math.pow(Simplex.noise3d(rh_seed, 7, 0.5, 0.34, po.x * sclx, po.y * scly + rh_yofs, po.z * sclz) * rh_sclh, rh_powe) + wos) / (1 + wos);}
