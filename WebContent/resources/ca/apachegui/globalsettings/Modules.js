define([ "dojo/_base/declare",
         "dojo/dom",
         "dijit/registry",
         "dojo/on",
         "dojo/request",
         "dojo/_base/array", 
         "dojo/data/ItemFileWriteStore"
], function(declare, dom, registry, on, request, array, ItemFileWriteStore){
	
	declare("ca.apachegui.globalsettings.Modules", null, {

		currentSharedModulesMenuId: "",
		currentSharedModulesRow: "",
		markedSharedModules: new Array(),
		currentAvailableModulesMenuId: "",
		currentAvailableModulesRow: "",
		initialized: false,
		
		init: function () {
			if(this.initialized===false) {
				var sharedMenu = registry.byId("sharedModules_menu");
				// when we right-click anywhere on the grid, make sure we open the menu
				sharedMenu.bindDomNode(sharedModulesGrid.domNode);
			
				var availableMenu = registry.byId("availableModules_menu");
				// when we right-click anywhere on the grid, make sure we open the menu
				availableMenu.bindDomNode(availableModulesGrid.domNode);
			
				this.addListeners();
				
				this.initialized=true;
			}
		},
		
		setCurrentSharedModulesMenuId: function(id) {
			this.currentSharedModulesMenuId=id.toString();
		},
		
		setCurrentSharedModulesRow:function (row) {
			this.currentSharedModulesRow=row;
		},
		
		getMarkedSharedModules: function() {
			return this.markedSharedModules;
		},
		
		getMarkedAvailableModules: function() {
			return this.markedAvailableModules;
		},
		
		markForRemoval:function () {
			if(this.markedSharedModules.indexOf(this.currentSharedModulesMenuId)==-1) {
				this.markedSharedModules.push(this.currentSharedModulesMenuId);
			}	
			
			sharedModulesStore.setValue(sharedModulesGrid.getItem(this.currentSharedModulesRow), "status", "Marked For Removal");
			if (sharedModulesStore.isDirty()) {
				sharedModulesStore.save();
			}
		},
		
		removeSharedModules: function() {
			var that=this;
			
			var mods=new Object();
			mods.option='removeSharedModules';
			mods.sharedModules='';
			var i=0;
			for(i=0;i<this.markedSharedModules.length; i++)
			{
				mods.sharedModules=mods.sharedModules + this.markedSharedModules[i];
				
				if(i!=(this.markedSharedModules.length-1)) {
					mods.sharedModules=mods.sharedModules + ':';
				}	
			}	
			
			var thisdialog = ca.apachegui.Util.noCloseDialog('Updating', 'Please Wait...');
			thisdialog.show();
			
			request.post("../Modules", {
				data: 	mods,
				handleAs: 'text',
				sync: false
			}).response.then(function(response) {
				
				var data = response.data;
				
				var status = response.status;
				if(status!=200) {
					ca.apachegui.Util.alert('Error',data);
				}
				that.refreshAll();
				
				thisdialog.remove();
			});
		},
		
		refreshSharedModules: function() {
			sharedModulesStore = new ItemFileWriteStore({url: '../Modules?option=shared', urlPreventCache: true});
			sharedModulesGrid.setStore(sharedModulesStore);
			this.markedSharedModules=new Array();
		},
		
		setCurrentAvailableModulesMenuId: function(id) {
			this.currentAvailableModulesMenuId=id.toString();
		},
		
		setCurrentAvailableModulesRow:function (row) {
			this.currentAvailableModulesRow=row;
		},
		
		showLoadDirective:function () {
			var thisdialog = ca.apachegui.Util.noCloseDialog('Loading', 'Please Wait...');
			thisdialog.show();
			
			request.post("../Modules", {
				data: {
					option: 'getLoadDirective',
					name: this.currentAvailableModulesMenuId
				},
				handleAs: 'text',
				sync: false
			}).response.then(function(response) {
				
				var data = response.data;
				
				var status = response.status;
				if(status!=200) {
					ca.apachegui.Util.alert('Error',data);
				} else {
					ca.apachegui.Util.alert('Load Directive', 'To use this module add the following directive to your apache configuration:<br/>' +
															  '<span style="font-weight:bold;">' + data + '</span>');
				}	
				
				thisdialog.remove();
			});
		},
		
		refreshAvailableModules: function() {
			availableModulesStore = new ItemFileWriteStore({url: '../Modules?option=available', urlPreventCache: true});
			availableModulesGrid.setStore(availableModulesStore);
			this.markedAvailableModules=new Array();
		},
		
		refreshAll: function () {
			this.refreshSharedModules();
			this.refreshAvailableModules();
		},
		
		addListeners: function () {
			var that=this;
			
			on(registry.byId('sharedModulesMenuItem'), "click", function() {
				that.markForRemoval();
			});
			
			on(registry.byId('availableModulesMenuItem'), "click", function() {
				that.showLoadDirective();
			});
			
			on(registry.byId('removalButton'), "click", function(){
				if(that.getMarkedSharedModules().length==0)
				{
					ca.apachegui.Util.alert("Nothing Selected","You have not selected any shared modules for removal.<br/>To select a module right click and select \"Mark For Removal\".");
				}
				else
				{
					ca.apachegui.Util.confirmDialog("Please Confirm", "Are you sure you want to remove all marked modules?",function confirm(conf){
						if(conf)
						{
							that.removeSharedModules();
						}
					});
				}
			});
			
			on(registry.byId('resetRemovalButton'), "click", function() {
				that.refreshSharedModules();
			});
			
			sharedModulesGrid.onRowContextMenu= function(e) {	
				var item = sharedModulesGrid.getItem(e.rowIndex);
				that.setCurrentSharedModulesRow(e.rowIndex); 
				array.forEach(sharedModulesGrid.store.getAttributes(item), function(attribute) {
					var id = sharedModulesGrid.store.getValues(item, attribute);
					if(attribute=='id')
					{	  
						that.setCurrentSharedModulesMenuId(id); 
					}
				});
			};
			
			on(registry.byId('resetAvailableButton'), "click", function() {
				that.refreshAvailableModules();
			});
			
			availableModulesGrid.onRowContextMenu= function(e) {	
				var item = availableModulesGrid.getItem(e.rowIndex);
				that.setCurrentAvailableModulesRow(e.rowIndex); 
				array.forEach(availableModulesGrid.store.getAttributes(item), function(attribute) {
					var id = availableModulesGrid.store.getValues(item, attribute);
					if(attribute=='id')
					{	  
						that.setCurrentAvailableModulesMenuId(id); 
					}
				});	
			};
		} 
	});
	
	ca.apachegui.globalsettings.Modules.currentModules=null;
	//used globally to grab instance
	ca.apachegui.globalsettings.Modules.getInstance = function() {
		if(!ca.apachegui.globalsettings.Modules.currentModules) {
			ca.apachegui.globalsettings.Modules.currentModules=new ca.apachegui.globalsettings.Modules();
		}
		
		return ca.apachegui.globalsettings.Modules.currentModules;
	};
	
});	
