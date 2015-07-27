define(function(require) {

    var Marionette = require('Marionette'),
        Epoxy = require('Epoxy');

    return Marionette.ItemView.extend({

        // Define per itemview whether Epoxy data binding should be available
        epoxyBindingEnabled: true,

        // Initialize function. Sets up the epoxy bindings if needed.
        initialize: function(options) {
            if (this.epoxyBindingEnabled) {
                this.epoxify();
                this.viewModel = options.viewModel;
            }
            this.triggerMethod('initialize');
        },

        // Applies the epoxy bindings etc.
        epoxify: function() {
            Epoxy.View.mixin(this);
            this.listenTo(this, 'ui:bind', this.applyBindings);
            this.listenTo(this, 'before:close', this.removeBindings);
        },

        // Override Marionette
        bindUIElements: function() {
            this.trigger('ui:bind');
            Marionette.View.prototype.bindUIElements.apply(this, arguments);
        }

    });

});