let currentPotd = null;

const potdData = {
    get() {
        return currentPotd;
    },

    set(potd) {
        currentPotd = potd;
    },

    clear() {
        currentPotd = null;
    }
};

export default potdData;