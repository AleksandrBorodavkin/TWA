import {create} from "zustand";

// Тип состояния
interface StoreState {
    createFormEventStatus: string;
    updateCreateFormEventStatus: (newData: string) => void;
    userStatus: string | null;
    updateUserStatus: (newData: string) => void;
}


// Создаем хранилище с типизацией
const useStore = create<StoreState>((set) => ({
    createFormEventStatus: '',
    updateCreateFormEventStatus: (newData) => set({createFormEventStatus: newData}),
    userStatus: null,
    updateUserStatus: (newData) => set({userStatus: newData}),
}));


export default useStore;
