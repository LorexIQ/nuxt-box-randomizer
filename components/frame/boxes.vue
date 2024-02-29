<script setup lang="ts">
import useBoxesStore, {type BlackBoxType} from "~/stores/useBoxesStore";

const route = useRoute();
const boxesStore = useBoxesStore();
const createModal = useSwitch();
const editModal = useSwitch();
const infoModal = useSwitch();
const modalData = reactive({} as BlackBoxType);
const isEdit = !!route.query.edit;
const extended = ref(false);

function createBox(_extended = false) {
  extended.value = _extended;
  createModal.show();
}
function editBox(id: number, _extended = false) {
  extended.value = _extended;
  Object.assign(modalData, boxesStore.getBoxById(id));
  editModal.show();
}
function infoBox(id: number) {
  Object.assign(modalData, boxesStore.getBoxById(id));
  infoModal.show();
}
</script>

<template>
  <div class="boxes">
    <block-box-frame-box
        v-if="boxesStore.boxes.length"
        v-for="box in boxesStore.boxes"
        :is-edit="isEdit"
        :key="box.id"
        :modelValue="box"
        :is-content-null="boxesStore.isDropContentNull(box.id)"
        @delete="boxesStore.deleteBox($event)"
        @edit="editBox($event)"
        @edit-extended="editBox($event, true)"
        @drop="boxesStore.dropResultFromBox($event)"
        @info="infoBox($event)"
    />
    <div
        class="boxes__null"
        v-else-if="!isEdit"
    >
      <h2>Нет коробок!</h2>
      <p>Добавьте '/?edit=true' в адресной строке</p>
    </div>

    <!--components for edit boxes-->
    <template v-if="isEdit">
      <block-box-frame-add
          @click="createBox()"
          @click.ctrl="createBox(true)"
      />
      <frame-create-modal
          :extended="extended"
          v-model="createModal"
          @create="boxesStore.createBox($event)"
      />
      <frame-edit-modal
          :extended="extended"
          :data="modalData"
          v-model="editModal"
          @save="boxesStore.updateBox($event)"
      />
    </template>
    <frame-info-modal
        :data="modalData"
        :results="boxesStore.results"
        v-model="infoModal"
        @drop="boxesStore.dropResultFromBox($event)"
        @clean="boxesStore.cleanResultsInBox($event)"
        @delete="boxesStore.deleteBox($event)"
    />
  </div>
</template>

<style scoped lang="scss">
.boxes {
  display: flex;
  justify-content: center;
  align-items: center;
  align-content: center;
  flex-wrap: wrap;
  gap: 15px;

  &__null {
    text-align: center;
    opacity: .5;

    & p {
      margin-top: 5px;
    }
  }
}
</style>
