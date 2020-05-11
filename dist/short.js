var visitorModal = Vue.component('vi-filter-bar', {
    props: ['options'],
    data: ()=>{
        return {
            _availableFilters : null,
            filters:[],
            numberOfAvailableProperties: 0,
            collapsed: false,
        }
    },
    methods: {
        //i.o.
        addFilter(){
            let vm = this;
            vm.filters.push({
                _availableFilters: vm._availableFilters,
                filterProperty: null,
                filterPropertyLabel: null,
                filterValue: null,
                filterValueLabel: null,
                filterRequired: false,
                getFilterFunction: vm.getFilter,
                getAvailableFilterProperties: vm.getAvailableFilterProperties
            });
        },

        addRequiredFilter(propertyLabel){
            let vm = this;

            let filter = vm.getFilter(propertyLabel)

            vm.filters.push({
                _availableFilters: vm._availableFilters,
                filterProperty: filter.filterProperty,
                filterPropertyLabel: filter.label,
                filterValue: filter.values[0].filterValue,
                filterValueLabel: filter.values[0].label,
                filterRequired: true,
                getFilterFunction: vm.getFilter,
                getAvailableFilterProperties: ()=>{return false}
            });

            vm.filerPropertyInUse({old:null, new: filter.label})
        },
        //Delete an Filter from the filters array
        deleteFilter(filterProperty){
            let vm = this;
            //delete filter from filters array.
            let tempfilters = []
            
            for(filter of vm.filters){
                if(filter.filterProperty != filterProperty){
                    tempfilters.push(filter);
                }else{
                    filter.status = 1;
                }
            }
            //override filters array with temp array.
            vm.filters = tempfilters;
            if(filterProperty != null){
                vm.getAvailableFilterProperties()
            }
        },

        //Mark filter property as in use
        filerPropertyInUse(opt){
            let vm = this;
            
            let oldLabel = opt.old;
            let newLabel = opt.new;

            let newFilter = vm.getFilter(newLabel);
            //set status to 'in use'
            newFilter.status = 0;
            //newFilter.required = false;

            if(oldLabel){
                let oldFilter = vm.getFilter(oldLabel);
                //set status to 'available'
                oldFilter.status = 1;
            }
        },

        //This request returns a list of available (not in use) filters
        getAvailableFilterProperties(){
            let vm = this;
            let result = [];
            for (property of vm._availableFilters){
                if(property.status > 0){
                    result.push(property.label)
                }      
            } 
            if(result.length > 0){
                vm.propsAvailable = true;
                vm.numberOfAvailableProperties = result.length;
                return result;
            }else{
                vm.propsAvailable = false;
                vm.deleteFilter(null);
                vm.numberOfAvailableProperties = 0;
                return false;
            }
        },

        //Returns the filter object from the _availableFilters property
        getFilter(propertyLabel){
            
            if(propertyLabel != null){
                let vm = this;
                for(property of vm._availableFilters){
                    if(propertyLabel == property.label){
                        return property;
                    }
                }
            }else{
                return false
            }
        },
        
        triggerCallback(){
            let vm = this;
            vm.options.uri = vm.uri;
            vm.$emit('trigger-callback', vm.options.uri)
        },

        toggleCoppapse(){
            let vm = this;
            vm.collapsed = !vm.collapsed;
            console.log(vm.collapsed);
        }
    },
    computed: {
        uri(){
            let vm = this;
            let uri = '';
            for(filter of vm.filters){
                if(filter.filterProperty != null && filter.filterValue != null){
                    //build uri string from filter property and value
                    uri += '&'+filter.filterProperty + '=' + filter.filterValue;
                }
            }
            return uri.slice(1, uri.length);
        },
    },
    created: async function(){
        let vm = this;
        
        //Copy filters array and add status property
        vm._availableFilters= vm.options.filters
        for(filter of vm._availableFilters){
            filter.status = 1;
            //add required filters
            if(filter.required){
                vm.addRequiredFilter(filter.label);
            }
        }

        vm.getAvailableFilterProperties()
        
    },
    template: 
    `
    <div class="vi-filter-bar">
        <div class="collapse-toggle">
            <button v-if="!collapsed" type="button" class="btn" v-on:click="toggleCoppapse()"><img class="clickable" src="src/assets/collapse-close.png" width="15" height="15"></button>
            <button v-if="collapsed" type="button" class="btn" v-on:click="toggleCoppapse()"><img class="clickable" src="src/assets/collapse-open.png" width="15" height="15"></button>
        </div>    
        
        <h5>Filter options</h5>
        
        <table v-if="!collapsed">
            <tr>
                <td v-for="filter in filters">
                    <vi-filter v-bind:filter="filter" v-on:filter-delete="deleteFilter($event)" v-on:filter-property-selected="filerPropertyInUse($event)"></vi-filter>
                </td>
                <td class="left"></td>
                <td>
                    <div v-if="true">
                        <button type="button" class="btn" v-on:click="addFilter()"><img class="clickable" src='src/assets/add.png' width="20" height="20"> ({{numberOfAvailableProperties}})</button>
                    </div>
                    
                </td>
                <td>
                    <button type="button" class="btn" v-on:click="triggerCallback()"><img class="clickable" src='src/assets/reload.png' width="20" height="20"></button>
                </td>
            </tr>
            
            <p class="mono">{{uri}}</p>
                
        </table>
    </div> 
    `

})
var visitorModal = Vue.component('vi-filter', {
    props: ['filter'],
    data: ()=>{
        return {
            availableProperties: []
        }
    },
    methods: {
        requestAvailableProperties(){
            let vm = this;
            vm.availableProperties = vm.filter.getAvailableFilterProperties();
        },
        getValues(propertyLabel){
            let vm = this;

            if(propertyLabel != null){
                let filter = vm.filter.getFilterFunction(propertyLabel);
                return filter.values;
            }else{
                return []
            } 
        },
        setFilterProperty(propertyLabel){
            let vm = this;
            //overrides filter Value
            vm.filter.filterValue = null;
            vm.filter.filterValueLabel = null;

            //get propertyValue for the given property label
            let filter = vm.filter.getFilterFunction(propertyLabel);
            
            let previousLabel = vm.filter.filterPropertyLabel;

            vm.filter.filterProperty = filter.filterProperty;
            vm.filter.filterPropertyLabel = filter.label;

            vm.$emit('filter-property-selected', {old: previousLabel, new: vm.filter.filterPropertyLabel});

            vm.requestAvailableProperties();

            /**
            if(previousLabel != null){
                let previousfilter = vm.getFilterFromParent(previousLabel);
                previousfilter.status = 1;
            }
            
            filter.status = 0; //mark property as in use.
            */
        },
        setFilterValue(Value, Label){
            let vm = this;
            vm.filter.filterValue = Value;
            vm.filter.filterValueLabel = Label;
            
        },
        deleteFilter(){
            let vm = this;
            
            let filter = vm.filter.getFilterFunction(vm.filter.filterPropertyLabel);
            if(filter){
                filter.status = 1;
            }
            this.$emit('filter-delete', vm.filter.filterProperty);
        },
        
    },
    computed: {   
    },
    mounted: async function(){
        let vm = this;
        //vm.requestAvailableProperties();
        
    },
    template: 
    `
    <div class="vi-filter">
        <table>
            <tr>
                <td class="left">
                    <div class="btn-group m-1">
                        <button class="btn btn-sm dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" v-on:click="requestAvailableProperties()">
                            {{filter.filterPropertyLabel}}
                        </button>
                        <div class="dropdown-menu" >
                            <a class="dropdown-item clickable" v-for="prop in availableProperties" v-on:click="setFilterProperty(prop)">{{prop}}</a>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="btn-group m-1">
                        <button class="btn btn-sm dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            {{filter.filterValueLabel}}
                        </button>
                        <div class="dropdown-menu">
                            <a class="dropdown-item clickable" v-for="value in getValues(filter.filterPropertyLabel)" v-on:click="setFilterValue(value.filterValue, value.label)">{{value.label}}</a>
                        </div>
                    </div>
                </td>
                <td v-if="!filter.filterRequired">
                    <img class="clickable" src='src/assets/delete.png' width="15" height="15" v-on:click="deleteFilter()">
                </td>
            </tr>
        </table>

    </div> 
    `

})