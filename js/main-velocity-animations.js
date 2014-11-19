$(document).ready(function() {
// #  ███╗   ██╗ █████╗ ██╗   ██╗       █████╗ ███╗   ██╗██╗███╗   ███╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗███████╗    
// #  ████╗  ██║██╔══██╗██║   ██║      ██╔══██╗████╗  ██║██║████╗ ████║██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝    
// #  ██╔██╗ ██║███████║██║   ██║█████╗███████║██╔██╗ ██║██║██╔████╔██║███████║   ██║   ██║██║   ██║██╔██╗ ██║███████╗    
// #  ██║╚██╗██║██╔══██║╚██╗ ██╔╝╚════╝██╔══██║██║╚██╗██║██║██║╚██╔╝██║██╔══██║   ██║   ██║██║   ██║██║╚██╗██║╚════██║    
// #  ██║ ╚████║██║  ██║ ╚████╔╝       ██║  ██║██║ ╚████║██║██║ ╚═╝ ██║██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║███████║    
// #  ╚═╝  ╚═══╝╚═╝  ╚═╝  ╚═══╝        ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝    
// #                                                                                                                        
$("nav.navbar").velocity({translateY:"-20",rotateX:["0" , "100deg"],width:["100%","190%"],rotateY:["0" , "-0.2"], scale:[ "1" , "0.99"],opacity:[ "1" , "0.30"] }, { duration: 450, easing : "linear"  }); 
$('.navbar-brand').velocity({translateY:"-20"},{ duration: 0, easing : "easeInBack"  }); 


; 

  
// #  ██╗███╗   ██╗████████╗██████╗  ██████╗     ████████╗███████╗██╗  ██╗████████╗
// #  ██║████╗  ██║╚══██╔══╝██╔══██╗██╔═══██╗    ╚══██╔══╝██╔════╝╚██╗██╔╝╚══██╔══╝
// #  ██║██╔██╗ ██║   ██║   ██████╔╝██║   ██║       ██║   █████╗   ╚███╔╝    ██║   
// #  ██║██║╚██╗██║   ██║   ██╔══██╗██║   ██║       ██║   ██╔══╝   ██╔██╗    ██║   
// #  ██║██║ ╚████║   ██║   ██║  ██║╚██████╔╝       ██║   ███████╗██╔╝ ██╗   ██║   
// #  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝        ╚═╝   ╚══════╝╚═╝  ╚═╝   ╚═╝   
// #                                                                               
// $("div.intro-lead-in").velocity({color:"#ffffff" }, { duration: 10, delay: 0, easing : "linear"  });
$("div.intro-lead-in").velocity({rotateX:["0" , "-14"],color:"#000", scale:[ "1" , "0.99"],opacity:[ "0" , "0"] }, { duration: 480, delay: 0, easing : "linear"  });
$("div.intro-lead-in").velocity({rotateX:["0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "1" , "0"] }, { duration: 1000, delay: 300, easing : "linear"  });

$("header").velocity({color:"#000",opacity:[ "0" , "0"] }, { duration: 480, delay: 0, easing : "linear"  });
$("header").velocity({rotateX:["0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "1" , "0"] }, { duration: 800, delay: 500, easing : "linear"  });


// $("div.intro-heading").velocity({color:"#ffffff" }, { duration: 10, delay: 0, easing : "linear"  });
$("div.intro-heading").velocity({rotateX:[ "0" , "-14"], color:"#000", scale:[ "1" , "0.99"],opacity:[ "0" , "0"] }, { duration: 480, delay: 0, easing : "linear"  });
$("div.intro-heading").velocity({rotateX:[ "0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "1" , "0"] }, { duration: 800, delay: 500, easing : "linear"  });


$(".btn-xl").velocity({rotateX:[ "0" , "-14"], backgroundColor: "#fed136",borderColor: "#fed136",color: "#000",opacity:[ "0" , "0"] }, { duration: 750, delay: 0, easing : "linear"  });
$(".btn-xl").velocity({rotateX:[ "0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "1" , "0"] }, { duration: 950, delay: 700, easing : "linear"  });

$(".btn-xl").mousedown(function(){
  
$(this).velocity({
     
  }, 250, "easeOut");

  $(this).velocity({
    translateY:"12",
borderRadius:"0.2em",
    rotateX: "26deg",
    scale:'0.97',
    // width:'5%',
    skewX:"-0.3",
    // translateX:"147",
    rotateY:"2deg",
     
  }, 150, "easeOut").velocity({
    translateY:"0",
    rotateX: "0deg",
borderRadius:"0em",
translateX:"0",
    rotateY:"0deg",
    // width:"10%",

    skewX:"0",
    scale:"1",        
    boxShadowBlur:"0",        
    boxShadowSpread:"0%",

  }, 200).velocity({
    
    rotateY:"0deg",
    rotateY:"0deg",
    // scale:"1",


    
  }, 225, "easeOutBounce").velocity("reverse", 250, "easeOutBounce");

  $("+ .shadow", this).velocity({
    translateY:"14",
    // skewX:"-3",
    // translateX:"6",
    // translateX:"38",
    width:"6%",
    height:".7rem",
    // scale: "1.3",
    opacity: "0.4",
  }, 180).velocity("reverse", 180, "easeOutBounce");

});
// #  ███████╗ ██████╗ ███╗   ██╗████████╗      ██████╗  ██████╗ ███╗   ███╗██████╗     
// #  ██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝      ██╔══██╗██╔═══██╗████╗ ████║██╔══██╗    
// #  █████╗  ██║   ██║██╔██╗ ██║   ██║   █████╗██████╔╝██║   ██║██╔████╔██║██████╔╝    
// #  ██╔══╝  ██║   ██║██║╚██╗██║   ██║   ╚════╝██╔══██╗██║   ██║██║╚██╔╝██║██╔══██╗    
// #  ██║     ╚██████╔╝██║ ╚████║   ██║         ██████╔╝╚██████╔╝██║ ╚═╝ ██║██████╔╝    
// #  ╚═╝      ╚═════╝ ╚═╝  ╚═══╝   ╚═╝         ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═════╝     
// #                                                                                    
$("#font-bomb").on('click', function(event) {

  
  $(this).html("Go back up, and click the text to blow the characters up!").velocity({
    translateY:"16",
    translateX:"",
    // padding:"10px",
    // paddingTop:"10px",
    // margin:"20px",
    scale: "1.1",
    // opacity: "1.2",
  }, 800).velocity("reverse", 450, "easeOut");
  /* Act on the event */ 
  $("#made-with-love").velocity({
    
    translateY:"-55",
    // padding:"20px",
    // paddingTop:"40px",
    margin:"20px",
  }, 100).velocity("reverse", 450, "easeOutBounce");
  /* Act on the event */
});

// #  ██╗  ██╗███████╗ █████╗ ██████╗ ████████╗      ███████╗███████╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗    
// #  ██║  ██║██╔════╝██╔══██╗██╔══██╗╚══██╔══╝      ██╔════╝██╔════╝██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║    
// #  ███████║█████╗  ███████║██████╔╝   ██║   █████╗███████╗█████╗  ██║        ██║   ██║██║   ██║██╔██╗ ██║    
// #  ██╔══██║██╔══╝  ██╔══██║██╔══██╗   ██║   ╚════╝╚════██║██╔══╝  ██║        ██║   ██║██║   ██║██║╚██╗██║    
// #  ██║  ██║███████╗██║  ██║██║  ██║   ██║         ███████║███████╗╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║    
// #  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝         ╚══════╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝    
// #                                                                                                            
$("#big-heart").mousedown(function(){
  $(this).velocity({
    scale:'1.19',
    rotateY:"200deg",
     
  }, 350, "easeOutBounce").velocity({
    rotateY:"0deg",
    scale:"1",        
    boxShadowBlur:"0",        
    boxShadowSpread:"0%",

  }, 375).velocity({    
    rotateY:"0deg",
    // scale:"1",


    
  }, 300, "easeOutBounce").velocity("reverse", 150, "easeOutBounce");


});

$(".icons").mousedown(function(){
  $(this).velocity({
    // rotateX: "26deg",
    scale:'0.77',
    rotateY:"4deg",
     
  }, 150, "easeOut").velocity({
    // rotateX: "0deg",
    rotateY:"0deg",
    scale:"1",        
    boxShadowBlur:"0",        
    boxShadowSpread:"0%",

  }, 200).velocity({
    
    rotateY:"0deg",
    rotateY:"0deg",
    // scale:"1",


    
  }, 225, "easeOutBounce").velocity("reverse", 250, "easeOutBounce");


});
// #  ██████╗  █████╗ ██████╗ ████████╗██╗ ██████╗██╗     ███████╗███████╗    
// #  ██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██║██╔════╝██║     ██╔════╝██╔════╝    
// #  ██████╔╝███████║██████╔╝   ██║   ██║██║     ██║     █████╗  ███████╗    
// #  ██╔═══╝ ██╔══██║██╔══██╗   ██║   ██║██║     ██║     ██╔══╝  ╚════██║    
// #  ██║     ██║  ██║██║  ██║   ██║   ██║╚██████╗███████╗███████╗███████║    
// #  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝╚══════╝╚══════╝╚══════╝    
// #         


  // Set canvas drawing surface
  var space = document.getElementById("surface");
  var surface = space.getContext("2d");
  var partState = "lighter";
  surface.scale(1,1.1);

   $('#surface').on('click', function() {
   if (partState==="xor"){
     partState="lighter";
   }else{
     partState="xor";
   }
  });
  
  // Set Particles
  var particles = [];
  var particle_count = 120;
  for(var i = 0; i < particle_count; i++) {
    particles.push(new particle());
  }
  var time = 0;
  // Set wrapper and canvas items size
  var canvasWidth=10;
  var canvasHeight=30;
  $(".canvas-wrapper").css({width:canvasWidth,height:canvasHeight});
  $("#surface").css({width:canvasWidth,height:canvasHeight});

  // shim layer with setTimeout fallback from Paul Irish
  window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            function( callback ){
              window.setTimeout(callback, 6000 / 60);
            };
  })(); 

  function particle() {
     
    this.speed = {x: -1+Math.random()*3, y: -3+Math.random()*2};
     canvasWidth = (document.getElementById("surface").width);
     canvasHeight= (document.getElementById("surface").height);
     this.location = {x: canvasWidth/2, y: (canvasHeight/2)+18};

    this.radius = .8+Math.random()*2;

    this.life = 20+Math.random()*20;
    this.death = this.life;
     if (partState==="lighter"){
      this.r = 255;
      this.g = Math.round(Math.random()*155);
      this.b = 0;
     }else{
       this.r = Math.round(Math.random()*255);
      this.g = Math.round(Math.random()*255);
      this.b = Math.round(Math.random()*255); 
     }
  }
  
  function ParticleAnimation(){
    surface.globalCompositeOperation = "source-over";
    surface.fillStyle = "rgba(0, 0, 0, 0.9)";
    surface.fillRect(0, 0, canvasWidth, canvasHeight);
    surface.globalCompositeOperation = partState;
    
    for(var i = 0; i < particles.length; i++)
    {
      var p = particles[i];
      surface.beginPath();

      p.opacity = Math.round(p.death/p.life*100)/100
      var gradient = surface.createRadialGradient(p.location.x, p.location.y, 0, p.location.x, p.location.y, p.radius);
      gradient.addColorStop(0, "rgba("+p.r+", "+p.g+", "+p.b+", "+p.opacity+")");
      gradient.addColorStop(0.5, "rgba("+p.r+", "+p.g+", "+p.b+", "+p.opacity+")");
      gradient.addColorStop(1, "rgba("+p.r+", "+p.g+", "+p.b+", 0)");
      surface.fillStyle = gradient;
      surface.arc(p.location.x, p.location.y, p.radius, Math.PI*2, false);
      surface.fill();
      p.death--;
      p.radius++;
      p.location.x += (p.speed.x);
      p.location.y += (p.speed.y);
      
      if(p.death < 0 || p.radius < 0){
        particles[i] = new particle();
      }
    }

  requestAnimFrame(ParticleAnimation);

}

ParticleAnimation();
$("#surface").velocity({ backgroundColorAlpha: "1",translateY:"14",translateX:"-4",height:"40",width:"40",rotateX:[ "0" , "-14"], backgroundColor: "#fed136",borderColor: "#fed136",color: "#eee",opacity:[ "0" , "0"] }, { duration: 750, delay: 0, easing : "linear"  });
$("#surface").velocity({rotateX:[ "0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "1" , "0"] }, { duration: 950, delay: 700, easing : "linear"  });

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
$("#surface").velocity({translateY:"24"}, { duration: 0, delay: 0, easing : "linear"  });

}

});
