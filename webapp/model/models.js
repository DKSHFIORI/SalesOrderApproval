sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		//<<Start of C001
		createUIModel: function (){
			const oViewModel = new JSONModel({
				GMText:{
					ZBAI: {
						GM1: "GM1 Indic.",
						GM1_P: "GM1% Indic."
					},

					DEFAULT: {
						GM1: "GM1",
						GM1_P: "GM1%"
					}
				},
				GM1Label: "",
				GM1PLabel: ""
			});

			return oViewModel;
		}
		//>>End of C001

	}

});