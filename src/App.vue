<script setup lang="ts">
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import OutputPane from './components/OutputPane.vue';
import MainPane from './components/MainPane.vue';
import SidePane from './components/SidePane.vue';
</script>

<template>
  <div class="min-h-[100vh]">
    <header>
      <div class="flex items-center bg-blue-100">
        <img alt="Mipsy logo" src="./assets/logo-no-bg.png" width="50" height="50" />
        ipsy
      </div>
    </header>
    <main class="h-[95vh]">
      <splitpanes vertical class='default-theme w-full h-full p-2'>
        <pane size='70'>
          <splitpanes horizontal>
            <pane size='70'>
              <MainPane />
            </pane>
            <pane size='30'>
              <OutputPane />
            </pane>
          </splitpanes>
        </pane>
        <pane size='30'>
          <SidePane />
        </pane>
      </splitpanes>
    </main>
  </div>
</template>

<style>
div.splitpanes__splitter {
  background-color: #eeeeee !important;

  &::before {
    background-color: #1e1e1e !important;
  }

  &::after {
    background-color: #1e1e1e !important;
  }
}
</style>
