<script setup lang="ts">
import type { Error } from '@/core/mips/types';

const props = defineProps<{
  errors: Error[];
}>();

</script>

<template>
  <div class="bg-white h-full">
    <ul>
      <li v-for="error in errors" :key="`${error.start.offset}-${error.end.offset}:${error.message}`">
        Line {{ error.start.line + 1 }}: {{ error.message }}
      </li>
    </ul>
  </div>
</template>
