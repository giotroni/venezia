// v0.1
var CORDOVA= true;
// git remote add origin https://github.com/giotroni/venezia.git
// git add .
// git commit -m "memorizzazione locale"
// git push origin master
// calcolo della distanza
function getDistanceFromLatLng(lat1,lng1,lat2,lng2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLng = deg2rad(lng2-lng1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c * 1000; // Distance in m
  return d;
}
// calcolo in gradi
function deg2rad(deg) {
  return deg * (Math.PI/180)
}
// funzione per l'ordinamento di una lista di numeri float
function mycomparator(a,b) {
    return parseFloat(a.dist) - parseFloat(b.dist) ;
}
// funzione per avere un numero a due digit
function doubleDigit(a) {
  if ( a<10) {
    return("0"+a)
  } else {
    return(a)
  }
}

function alertDummy(){
  
}

function messaggio( tit, testo, btn){
  if ( CORDOVA ) {
    navigator.notification.alert(testo, alertDummy)
      //tit,
      //btn
      //);
  } else {
    console.log(tit + ' ' + testo);      
  }  
}
// MAIN
var app = {
    storage: window.localStorage,   // per il salvataggio locale delle info
    user_data: {nome: "", id: 0},
    initialize: function() {
        this.bind();
    },
     
    bind: function() {
        if ( CORDOVA) {
          document.addEventListener('deviceready', this.deviceready, false);
        }
        // alert("ok");
        $("#page-home").on("tap", app.intro);
        $("#popupIntro").on("tap", app.introClose);
        $("#btnLogin").on("tap", app.login);
        $("#btnEntra").on("tap", app.entra);
        
        //$("#page-home").on("swipeleft", app.entra);
        //$("#swipeCopertina").on("tap", app.entra);
        //$("#btnLst").on("tap", app.entra);
        
        $("#page-interno").on("swipeleft", app.torna_copertina);

        $("#btnPosition").on("tap", mappa.getPos);
        $("#btnMap").on("tap", app.showMap);
        $("#btn_enigma").on("tap", app.chek_answer);

    },
     
    deviceready: function() {
        app.start();
        
    },
 
    start: function() {

    }
}
app.intro= function (){
  $( '#popupIntro' ).popup( 'open' )
}
app.introClose= function (){
  $( '#popupIntro' ).popup( 'close' )
}

app.login= function (){
  alert(app.user_data.nome + " " + app.user_data.id);
  if ( app.user_data.nome!="") {
    app.entra_pagina();
  } else {
    // non è stato ancora impostato alcun utente
    $( '#popupLogin' ).popup( 'open' )
  }
}
// 
app.entra= function (){
  //alert("swipeCopertina");
  //$( '#popupLogin' ).popup( 'close' )
  var utente = $('#un').val().toLowerCase();
  if (utente.length<4) {
    messaggio('Attenzione!', 'Nome troppo corto', 'Ok')
    return;
  }
  app.user_data.nome = utente; 
  $.ajax({
    type: 'GET',
    url: URL_PREFIX +'php/leggi_user.php',
    async: false,
    data: {
      user: utente
      },
    cache: false
  }).done(function(result) {
    app.user_data.id = result*1;
    app.storage.setItem("user", JSON.stringify(app.user_data));
    //alert(app.user_data.nome + " " + app.user_data.id);
  }).fail(function(){
    messaggio('Attenzione!', 'Problema di connessione', 'Ok')
  });
  app.entra_pagina();
}

app.entra_pagina = function (){
  mappa.leggiDati();
  $.mobile.pageContainer.pagecontainer("change", "#page-interno", {
      transition: 'slide',
      changeHash: false,
      reverse: true,
      showLoadMsg: true
  });
  // mette in ordine i luoghi sulla base della distanza dal punto attuale
  mappa.sortPlaces();
  // aggiorna la lista dei luoghi
  mappa.lstPlacesUpdate();
  alert(app.user_data.nome + " " + app.user_data.id);
}
// ritorna alla copertina    
app.torna_copertina= function (){
  //alert("swipeInterno");
  //alert(app.currentpage);
  $.mobile.pageContainer.pagecontainer("change", "#page-home", {
      transition: 'flip',
      changeHash: false,
      reverse: true,
      showLoadMsg: true
  });
}
    
// mosta la pagina con la mappa
app.showMap = function(){
  $.mobile.pageContainer.pagecontainer("change", "#page-map", {
      transition: 'flip',
      changeHash: false,
      reverse: true,
      showLoadMsg: true
  });
  if ( navigator.geolocation ) {
      function success(pos) {
          // Location found, show map with these coordinates
          mappa.drawMap(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
      }
      function fail(error) {
          mappa.drawMap(mappa.defaultLatLng);  // Failed to find location, show default map
      }
      // Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
      navigator.geolocation.getCurrentPosition(success, fail, {maximumAge: 500000, enableHighAccuracy:true, timeout: 6000});
  } else {
      mappa.drawMap(mappa.defaultLatLng);  // No geolocation support, show default map
  }
}
// mostra la pagina con l'arcano
app.arcanoShow = function(id) {
  // var obj = searchPostiById(this.id);
  var testo = mappa.luoghi[id].desc_long;
  var immg = mappa.luoghi[id].img;
  var enigma = mappa.luoghi[id].testo_enigma;
  $('#id_arcano').attr('valore', id);
  $('#tit-arcano').html("<h2>Gli arcani: "+mappa.luoghi[id].descrizione+"</h2>");
  if (mappa.luoghi[id].visitato != "0000-00-00 00:00:00") {
    $('#posto_img').attr('src', "img/"+immg);    
    $('#content-arcano').html(testo);
    // $('#arcano_img').attr('src', "");
    if (mappa.luoghi[id].risolto>0 ) {
      $('#id_arcano').html("ARCANO: "+mappa.luoghi[id].arcano)
      $('#form_arcano').hide();
    } else {
      $('#form_arcano').show();
    }
    $('#testo_enigma').html('<h2>'+enigma+'</h2>')
  } else {
    $('#form_arcano').hide();
    $('#posto_img').attr('src', "img/arcano.png");    
    $('#content-arcano').html(testo);
    //$('#arcano_img').attr('src', "img/arcano.png");    
    $('#testo_enigma').html('')
  }
  $.mobile.pageContainer.pagecontainer("change", "#page-arcano", {
      transition: 'flip',
      changeHash: false,
      reverse: true,
      showLoadMsg: true
  });
}
// controlla il tentativo di risposta
app.chek_answer = function(){
  var risposta = $('#input_enigma').val();
  // alert(risposta );
  var id = $('#id_arcano').attr('valore');
  // alert(id);
  // alert(mappa.luoghi[id].risposta_enigma);
  if ( risposta == mappa.luoghi[id].risposta_enigma) {
    messaggio("Bravo", "Hai risorto l'enigma di "+ mappa.luoghi[id].descrizione, "Ok")
    mappa.luoghi[id].risolto = 1;
    $('#form_arcano').hide();
    mappa.scriviDati();
  } else {
    messaggio("Sbagliato!", "mi dispiace. Riprova!", "Ok");
  }
}
// classe con i luoghi e la mappa
var mappa = {
  // distanza entro cui si settta il posto come visitato
  VICINO: 100,
  // Coordinate di default
  defaultLatLng: new google.maps.LatLng(45.440731, 12.321594),
  // elenco dei luoghi
  luoghi: [],
  
  leggiDati: function(){
      while(mappa.luoghi.length > 0) {
        mappa.luoghi.pop();
      };
      $.ajax({
        type: 'GET',
        url: URL_PREFIX + 'php/leggi_luoghi.php',
        async: false,
        data: {
          tipo: 'maggiore',
          user: app.user_data.id
          },
        cache: false
      }).done(function(result) {
        var obj = $.parseJSON(result);
        $.each(obj, function(i, valore){
          mappa.luoghi.push(valore);
          //alert(mappa.luoghi[i].descrizione);
        })
      }).fail(function(){
        messaggio("Attenzione!","Problemi di conenssione", "Ok");
      })
      
  },

  scriviDati: function(){
    var arr = JSON.stringify(mappa.luoghi);
    $.ajax({
      type: 'GET',
      url: URL_PREFIX + 'php/scrivi_dati.php',
      async: false,
      data: {
        tipo: 'maggiore',
        user: 1,
        dati: arr
        },
      cache: false
    }).fail(function(){
        messaggio("Attenzione!","Problemi di conenssione", "Ok");
    })
    // alert(arr);  
  },
  // funzione che inizializza i dati
  // funzione che legge la posizione attuale
  getPos: function(){
    navigator.geolocation.getCurrentPosition(mappa.onSuccessGeo, mappa.onErrorGeo, { timeout: 30000 });    
  },
  // funzione che disegna la mappa
  drawMap: function(latlng) {
    var myOptions = {
      zoom: 15,
      center: latlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
    // Add an overlay to the map of current lat/lng
    var marker = new google.maps.Marker({
      position: latlng,
      map: map,
      icon: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-pushpin.png',
      title: "Your're here!"
    });
    $.each(mappa.luoghi, function(key, value){
      var newMarker = new google.maps.Marker({
        position: new google.maps.LatLng(value.lat,value.lon),
        map: map,
        title: value.descrizione
      });
    })        
  },
  // aggiorna la lista dei mappa.luoghi, ordinandola sulla base della distanza
  sortPlaces: function(){
    $.each(mappa.luoghi, function(key, value){
      value.dist = getDistanceFromLatLng(value.lat, value.lon, mappa.defaultLatLng.lat(), mappa.defaultLatLng.lng() )
    })
    mappa.luoghi.sort(mycomparator);    
  },
  // mostra elenco luoghi
  lstPlacesUpdate: function() {
    var punti = 0;
    var num_arcani = 0;
    var num_risolti = 0;
    $('#lstPlaces').empty();
    $.each(mappa.luoghi, function(key, value){
      var testo = '<li id="'+ key +'" ><a href="#lista_arcani" >';
      var visited = (value.visitato != "0000-00-00 00:00:00");
      if (visited) {
        num_arcani++;
        testo += '<img src="img/'+value.img+'" >';
      } else {
        testo += '<img src="img/questionmark.png" >';
      }
      testo += '<p>'+value.descrizione ;
      if (value.risolto>0) {
        num_risolti++;
        punti += value.punti * 1;
        testo += ' - <b> Codice: '+ value.arcano +'</b></p>';
      } else {
        testo += '</p>';
      }
      testo += '<p>'+mappa.showDist(value.dist);
      if (visited) {
        testo += " Raggiunto il " + value.visitato;
      }
      testo += '</p>';
      testo += '</a></li>';
      $('#lstPlaces').append(testo);
      $("#lstPlaces li").bind("click", function(){
          app.arcanoShow(this.id);
      });
    })
    $('#lstPlaces').listview("refresh");
    $('#punti').html("Caro <b>"+app.user_data.nome+"</b>, hai trovato "+num_arcani+" Arcani, risolto "+num_risolti+" enigmi, per un totale di <b>"+punti+" punti</b>")
  },
  // verifica se è arrivato in un posto
  checkArrivato: function(){
    $.each(mappa.luoghi, function(key, value){
      if (value.visitato=="0000-00-00 00:00:00") {
        if (value.dist<mappa.VICINO) {
          // value.visitato= new Date();
          var d = new Date();
          
          var curr_date = doubleDigit(d.getDate());
          
          var curr_month = doubleDigit(d.getMonth());
          
          var curr_year = d.getFullYear();
          var curr_hour = doubleDigit(d.getHours());
          var curr_min = doubleDigit(d.getMinutes());
          var curr_sec = doubleDigit(d.getSeconds());
          value.visitato = curr_year+ "-" + curr_month + "-" + curr_date+ " " + curr_hour+ ":" + curr_min+":" + curr_sec;
          
          mappa.scriviDati();
        }
      }
    })
  },
  // mostra la distanza
  showDist: function(dst){
    var retVal = "";
    if ( dst > 1000 ) {
      retVal = ((dst/1000).toFixed(1)) + " km";
    } else {
      retVal = Math.round(dst) + " mt";
    }
    return retVal;
  }
}
// chiamata quando la posizione è stata letta
mappa.onSuccessGeo = function(position){
  mappa.defaultLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
  mappa.sortPlaces();
  mappa.checkArrivato();
  mappa.lstPlacesUpdate();
}
// chiamata quando c'è un errore nella lettura della posizione
mappa.onErrorGeo = function(error) {
  messaggio("Attenzione!","Problemi di conenssione", "Ok");
}

$(document).ready(function() {
    app.initialize();
      if ( CORDOVA ) {
        alert("prova");
        URL_PREFIX = "http://www.troni.it/venezia/";
          var value = app.storage.getItem("user");
          if (value === null) {
            alert("Non valido");
          } else {
            app.user_data = JSON.parse(value);
            alert(app.user_data.nome + " " + app.user_data.id);
            $("#nome").html(app.user.data.nome)
          }
  
      } else {
        URL_PREFIX = "";
      }

});
