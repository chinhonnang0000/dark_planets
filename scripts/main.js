require("dapl_main"); 

// check script working
Events.on(ContentInitEvent, e =>
{ 
   Vars.content.planet("erekir").allowLaunchToNumbered = true;  
   Vars.content.planet("erekir").hiddenItems = new Seq();
   Vars.content.planet("serpulo").hiddenItems = new Seq(); 
});
