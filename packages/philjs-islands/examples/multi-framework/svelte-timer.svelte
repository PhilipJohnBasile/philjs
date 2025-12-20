<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let autoStart: boolean = false;
  export let label: string = 'Timer';

  let seconds = 0;
  let isRunning = false;
  let interval: number | null = null;

  function start() {
    if (!isRunning) {
      isRunning = true;
      interval = window.setInterval(() => {
        seconds++;
      }, 1000);
    }
  }

  function pause() {
    isRunning = false;
    if (interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  }

  function reset() {
    pause();
    seconds = 0;
  }

  function formatTime(secs: number): string {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const remainingSeconds = secs % 60;

    return [hours, minutes, remainingSeconds]
      .map(n => n.toString().padStart(2, '0'))
      .join(':');
  }

  onMount(() => {
    if (autoStart) {
      start();
    }
  });

  onDestroy(() => {
    pause();
  });
</script>

<div class="timer-island" style="
  padding: 20px;
  border: 2px solid #ff3e00;
  border-radius: 8px;
  background-color: #fff;
  color: #333;
  text-align: center;
">
  <h3>Svelte Timer</h3>
  <p style="font-size: 12px; opacity: 0.7;">{label}</p>

  <div style="
    font-size: 48px;
    font-weight: bold;
    font-family: monospace;
    margin: 20px 0;
    color: #ff3e00;
  ">
    {formatTime(seconds)}
  </div>

  <div style="display: flex; gap: 10px; justify-content: center;">
    {#if isRunning}
      <button on:click={pause} style="
        padding: 10px 20px;
        font-size: 16px;
        background-color: #ff3e00;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">
        Pause
      </button>
    {:else}
      <button on:click={start} style="
        padding: 10px 20px;
        font-size: 16px;
        background-color: #ff3e00;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">
        Start
      </button>
    {/if}

    <button on:click={reset} style="
      padding: 10px 20px;
      font-size: 16px;
      background-color: #666;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    ">
      Reset
    </button>
  </div>

  <p style="margin-top: 15px; font-size: 14px; opacity: 0.6;">
    Status: {isRunning ? 'Running' : 'Stopped'}
  </p>
</div>
