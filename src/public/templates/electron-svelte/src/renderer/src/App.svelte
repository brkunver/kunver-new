<script lang="ts">
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
</script>

<main class="flex flex-col items-center justify-center">
  <h1 class="text-3xl font-bold">Hello World</h1>
  <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded" onclick={ipcHandle}>Send IPC</button>
</main>
