<script setup lang="ts">
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import OutputPane from './components/OutputPane.vue';
import MainPane from './components/MainPane.vue';
import SidePane from './components/SidePane.vue';
import { ref, type Ref } from 'vue';
import type { Error } from './core/mips/types';

const errors: Ref<Error[]> = ref([]);

function handleErrorsChange(newErrors: Error[]) {
  errors.value = newErrors;
}
</script>

<template>
  <div class="min-h-[100vh]">
    <header class="p-2 min-h-[5vh] bg-blue-200">
      <div class="flex items-center">
        <img alt="Mipsy logo" src="./assets/logo-no-bg.png" width="50" height="50" />
        <span class="text-2xl font-bold">ipsy</span>
      </div>
    </header>
    <main class="h-[95vh] p-0 m-0">
      <splitpanes vertical class='default-theme w-full h-full'>
        <pane size='70'>
          <splitpanes horizontal>
            <pane size='70'>
              <MainPane @errors-change="handleErrorsChange" />
            </pane>
            <pane size='30'>
              <OutputPane :errors="errors" />
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
