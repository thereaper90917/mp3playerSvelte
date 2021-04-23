<script>
  const {ipcRenderer} = require('electron')
  const {Howl, Howler} = require('howler');


// From Electron
let current = 0
let src
let songSrc = []


function formatTime(secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

      
      function clickedSrc(e){
        e.preventDefault();
        let volume = document.getElementById("volume")
        let getHref = e.currentTarget.getAttribute("href")
        let progress = document.getElementById('progress');
        let duration = document.getElementById('duration');
        let running = document.getElementById('test');
        
        


        volume.addEventListener('change',(e)=>{
          let floatVolume = parseFloat(e.target.value)
          Howler.volume(floatVolume)
        })

        function step() {
        let seek = sound.seek() || 0;
        let time = (((seek / sound.duration()) * 100) || 0);
        progress.value = time.toFixed(0)
        running.innerHTML = `${time.toFixed(2)}  /`
          
          if (sound.playing()) {
              requestAnimationFrame(step);
            }
          }

        
        let sound = new Howl({
        src: [getHref],
        onplay: function(){
          requestAnimationFrame(step)
          duration.innerHTML = `${formatTime(Math.round(sound.duration()))}`
        },
        });
        sound.play();
        setSrc(getHref)
        
      }
    function setSrc(msg){
       src = msg
       
      }

      function test(){
        let sound = new Howl({
        src: [src],
        volume: 1.5,
        });
        sound.play();
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

</script>




<section  class="section is-flex-direction-column " style="height: 100%; width:100%;">
  <div style="max-height: 200px; max-width:100% ;overflow-y: scroll;">
    <table class="table is-fullwidth is-align-content-center is-justify-content-center border" style="height:300px;width:100%;">
      <thead>
        <tr>
          <!-- <th class="sticky">Artist</th> -->
          <th class="sticky has-text-white">Song</th>
        </tr>
      </thead>
      <tbody>
        {#if songSrc !== []}
          {#each songSrc as source}
              <tr>
                  <!-- <th>Seether</th> -->
                  <td><a href="{source}" on:click="{clickedSrc}" title="">{source}</a>
              </tr>
      
            {/each}
        {/if}
      </tbody>
    </table>
    </div>
    <div>
      
      <div class=" border buttons is-align-content-center mt-2  "style="height: 100%; width:100%;" id="player">
        <button class="button" on:click="{openDialog}"><i class="fas fa-play fa-2x"></i></button>
        <button class="button" on:click="{test}"><i class="fas fa-stop fa-2x"></i></button>
        <div style="height:20%; width:30%">
          <span class="has-text-white mr-1" id="test"></span>
          <span class="has-text-white" id="duration"></span>
        </div>
       
        <progress id="progress" class="progress is-danger" value="" max="100"></progress>
        
        <i class="ml-2 fas fa-volume-up fa-2x"><label for="text"  class="has-text-white ml-2">{current}</label></i>
        
        
        <input id="volume" class="slider is-fullwidth is-medium is-danger is-circle" step="0.1" min="0" max="1" value="10" type="range" on:change={(e)=> current= parseFloat(e.target.value) * 100} Precision= "2">
        
      </div>
        
       
      </div>
</section>

