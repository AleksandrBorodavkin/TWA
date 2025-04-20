import {create} from "zustand";

// Тип состояния
interface StoreState {
    createFormEventShow: string;
    updateCreateFormEventShow: (newData: string) => void;

    userIsMember: boolean | null;
    updateUserIsMember: (newData: boolean) => void;
}


// Создаем хранилище с типизацией
const useStore = create<StoreState>((set) => ({
    createFormEventShow: '',
    updateCreateFormEventShow: (newData) => set({createFormEventShow: newData}),

    userIsMember: null,
    updateUserIsMember: (newData) => set({userIsMember: newData}),
}));


export default useStore;
