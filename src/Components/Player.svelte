<script>
  const {ipcRenderer} = require('electron')
  const {Howl, Howler} = require('howler');


// From Electron
let current = 10
let value = 0.1
let src = ''
let songSrc = []
let playingSong = true

function formatTime(secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}


  

      
    //   function clickedSrc(e){
    //     e.preventDefault();
    //     let volume = document.getElementById("volume")
    //     let getHref = e.currentTarget.getAttribute("href")
    //     let progress = document.getElementById('progress');
    //     let duration = document.getElementById('duration');
    //     let running = document.getElementById('test');
        
        


    //     volume.addEventListener('change',(e)=>{
    //       let floatVolume = parseFloat(e.target.value)
    //       Howler.volume(floatVolume)
    //     })

    //     function step() {
    //     let seek = sound.seek() || 0;
    //     let time = (((seek / sound.duration()) * 100) || 0);
    //     progress.value = time.toFixed(0)
    //     running.innerHTML = `${time.toFixed(2)}  /`
          
    //       if (sound.playing()) {
    //           requestAnimationFrame(step);
    //         }
    //       }

        
    //     let sound = new Howl({
    //     src: [getHref],
    //     onplay: function(){
    //       requestAnimationFrame(step)
    //       duration.innerHTML = `${formatTime(Math.round(sound.duration()))}`
    //     },
    //     });
    //     sound.play();
    //     setSrc(getHref)
        
    //   }
    
    function srcLink(e){
      e.preventDefault()
      let getHref = e.currentTarget.getAttribute("href")
      setSrc(getHref)
      // console.log(getHref)
      
    }


    function setSrc(linkSrc){
       src = linkSrc
       return src
      }


    // Dialog
    ipcRenderer.on('srcPath', (e,data) =>{
      srcPaths(data)
    })

    function srcPaths(path){
      songSrc = path
     
    }


// Svelte

function openDialog(){
  ipcRenderer.send("opendialog")
}

function toggleSong(e){
        e.preventDefault();
        let volume = document.getElementById("volume")
        let progress = document.getElementById('progress');
        let duration = document.getElementById('duration');
        let running = document.getElementById('running');
        Howler.volume(0.1)
        


        volume.addEventListener('change',(e)=>{
          let floatVolume = parseFloat(e.target.value)
          Howler.volume(floatVolume)
        })

        function step() {
        let seek = sound.seek() || 0;
        let time = (((seek / sound.duration()) * 100) || 0);
        
        progress.value = time.toFixed(0)
        running.innerHTML = `${formatTime(Math.round(seek))}  /`
          
          if (sound.playing()) {
              requestAnimationFrame(step);
            }
          }

        
        let sound = new Howl({
        src: [src],
        onplay: function(){
          requestAnimationFrame(step)
          duration.innerHTML = `${formatTime(Math.round(sound.duration()))}`
        },
        });



        setTimeout(() => {
          
          if(src == ''){
            playingSong = true
          }else{
            playingSong = !playingSong
          }
          }, 1200);
        
        if (playingSong){
          sound.play()
          
        } else {
          Howler.stop()
        }
}

function stopSong(){
  Howler.stop()
  current = 10
  value = 0.1
  playingSong = true
}

</script>




<section  class="section is-flex-direction-column" style="height: 100%; width:100%;">
  <div style="max-height: 300px; min-height: 300px; max-width:100% ;overflow-y: scroll;">
    <table class="table is-fullwidth is-align-content-center is-justify-content-center border">
      <thead>
        <tr>
          <th class="sticky has-text-white">Song</th>
        </tr>
      </thead>
      <tbody>
        {#if songSrc !== []}
          {#each songSrc as source}
              <tr>
                  <td><a href="{source}" on:click="{srcLink}" title="">{source}</a>
              </tr>
            {/each}
        {/if}
      </tbody>
    </table>
    </div>
    <div class=" border mt-2">
      
      <div class="buttons is-align-content-center is-justify-content-center is-justify-content-space-evenly mt-2" id="player">
        <button class="button" on:click="{openDialog}"><i class="fas fa-folder-plus fa-2x"></i></button>
        <button class="button" on:click="{toggleSong}">
          {#if playingSong}<i class="fas fa-play fa-2x"></i>{/if}
          {#if !playingSong}<i class="fas fa-pause fa-2x"></i>{/if}
        </button>
        <button class="button" on:click="{stopSong}"><i class="fas fa-stop fa-2x"></i></button>
        <!-- <button class="button" on:click="">TEST</button> -->
        <div style="height:20%; width:30%">
          <span class="has-text-white mr-1" id="running"></span>
          <span class="has-text-white" id="duration"></span>
        </div>
       
        <progress id="progress" class="progress is-danger" value="" max="100"></progress>
        {#if current < 40}
        <i class="ml-2 fas fa-volume-down fa-2x"><label for="text"  class="has-text-white ml-2">{current}</label></i>
        {/if}
        {#if current >= 40}
        <i class="ml-2 fas fa-volume-up fa-2x"><label for="text"  class="has-text-white ml-2">{current}</label></i>
        {/if}
       
        
        
        <input id="volume" class="slider is-fullwidth is-medium is-danger is-circle" step="0.1" min="0" max="1" value="{value}" type="range" on:change={(e)=> {value= e.target.value;current= parseFloat(e.target.value) * 100}} Precision= "2">
        
      </div>
        
       
      </div>
</section>

