import {computed} from "@vue/reactivity";

export type BlackBoxContentType = {
    id: number;
    title: string;
}
export type BlackBoxType = {
    id: number;
    title: string;
    random: boolean;
    content: BlackBoxContentType[];
};
export type BlackBoxCreate = {
    title: string;
    random: boolean;
    content: BlackBoxContentType[];
}
export type BlackBoxUpdate = BlackBoxType;
export type BlackBoxResult = {
    id: number;
    boxId: number;
    contentId: number;
};

export default defineStore('boxes', () => {
    const storageName = 'boxesStorage';
    const boxes = reactive<BlackBoxType[]>([]);
    const results = reactive<BlackBoxResult[]>([]);
    let resultsIndent = 0;

    const saveBoxes = () => {
        localStorage.setItem(storageName, JSON.stringify(boxes));
    };
    const readBoxes = () => {
        const savedData = localStorage.getItem(storageName);
        if (!savedData) return;
        Object.assign(boxes, JSON.parse(savedData));
    };

    const createBox = (data: BlackBoxCreate) => {
        boxes.push({
            id: boxes.length ? boxes.at(-1)!.id + 1 : 0,
            ...data
        });
        return boxes.at(-1);
    };
    const updateBox = (data: BlackBoxUpdate) => {
        Object.assign(boxes[boxes.findIndex(box => box.id === data.id)], data);
    };
    const deleteBox = (id: number) => {
        return boxes.splice(boxes.findIndex(el => el.id === id), 1)[0];
    };
    const getBoxById = (id: number) => {
        return boxes.find(el => el.id === id);
    };
    const dropResultFromBox = (id: number) => {
        const box = getBoxById(id);
        const boxResults = results.filter(result => result.boxId === box?.id);
        if (!box || box.content.length <= boxResults.length) return;
        const filteredContend = box.content.filter(el => !boxResults.find(result => result.contentId === el.id));

        if (box.random) {
            const randContent = filteredContend.splice(Math.floor(Math.random() * filteredContend.length), 1)[0];
            results.unshift({ id: resultsIndent++, boxId: box.id, contentId: randContent.id });
        } else {
            const topContent = filteredContend.splice(0, 1)[0];
            results.unshift({ id: resultsIndent++, boxId: box.id, contentId: topContent.id });
        }

        return results[results.length - 1];
    };
    const isDropContentNull = (id: number) => {
        const box = getBoxById(id)!;
        const boxContent = results.filter(result => result.boxId === box?.id);
        return !(box.content.length - boxContent.length);
    };
    const cleanResultsInBox = (id: number) => {
        const withoutBoxResults = results.filter(result => result.boxId !== id);
        results.splice(0);
        Object.assign(results, withoutBoxResults);
    };
    const deleteAllBoxes = () => {
        boxes.splice(0);
    };
    const cleanAllResults = () => {
        results.splice(0);
    };
    const getTitleByResult = (data: BlackBoxResult) => {
        const box = boxes.find(box => box.id === data.boxId)!;
        const content = box.content.find(content => content.id === data.contentId)!;

        return `[${box.title}] ${content.title}`;
    };

    // read/save state
    readBoxes();
    watch(boxes, () => saveBoxes());

    const computeds = {
        boxes: computed(() => boxes),
        results: computed(() => results),
    };
    const functions = {
        createBox,
        updateBox,
        deleteBox,
        getBoxById,
        dropResultFromBox,
        isDropContentNull,
        cleanResultsInBox,
        deleteAllBoxes,
        cleanAllResults,
        getTitleByResult
    };

    return {
        ...computeds,
        ...functions
    }
});
