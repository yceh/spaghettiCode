export class BiMap{
    constructor(){
        this.F2S={};
        this.S2F={};
    }
    addElement(dict,k,e){
        if (k==null){
            return;
        }
        if (typeof dict[k]=="undefined") {
            if (e==null) {
                dict[k]=new Set();
            }else{
                dict[k]=new Set([e]);
            }
        }else{
            if (e!=null) {
                dict[k].add(e);
            }
        }
    }
    add(first,second){
        this.addElement(this.F2S,first,second);
        this.addElement(this.S2F,second,first);
    }
    remove(e){
        if(typeof this.F2S[e]=="undefined"){
            this.S2F[e].forEach(element => {
                this.F2S[element].remove(e);
            });
            delete this.S2F[e];
        }else{
            this.F2S[e].forEach(element => {
                this.S2F[element].remove(e);
            });
            delete this.F2S[e];
        }
    }
}