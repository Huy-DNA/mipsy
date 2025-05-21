<script setup lang="ts">
import type { Error } from '@/core/mips/types';
import Editor from './editor/Editor.vue';

const emit = defineEmits<{
  (e: 'errorsChange', errors: Error[]): void,
}>();
</script>

<template>
  <Editor @errors-change="(errors) => emit('errorsChange', errors)" />
</template>
