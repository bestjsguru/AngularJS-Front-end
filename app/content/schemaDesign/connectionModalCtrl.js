'use strict';

import {Helpers} from '../common/helpers';

const JOIN_TYPES = ['inner', 'left outer', 'right outer', 'left', 'right', 'full'];

import './columnSelector/columnSelector.component';
import { sortStringValues } from './helpers/columnsHelper';

import {TableRelationExtraConditionModel} from './tableRelationExtraCondition.model.js';
import OPERATORS from '../common/filters/filters.module.js';

export class ConnectionModalCtrl {
    constructor(connection, canvasInstance, tables, $uibModalInstance, scope, PlumbService, toaster, TableRelationService) {
        this.connectionData = connection;
        this.connection = angular.copy(connection);
        this.oldConnection = angular.copy(connection);

        this.tables = tables;
        this.modal = $uibModalInstance;
        this.$scope = scope;
        this.canvasInstance = canvasInstance;
        this.TableRelationService = TableRelationService;
        this.toaster = toaster;
        this.PlumbService = PlumbService.create(scope, canvasInstance);

        this.loading = false;
        this.confirm = false;
        this.availableJoinTypes = JOIN_TYPES;
        this.joinType = this.availableJoinTypes[0];

        this.isExtraConditionLoading = false;
        this.isDoAnyAction = false;

        this.submitted = false;
        this.operators = OPERATORS.all;

        if(this.connection.relation){
            this.prepareModal(this.connection.relation);
        }else{
            this.prepareTables();
            this.extraConditions = [];
        }
    }

    prepareTables() {
        this.prepareTable('source');
        this.prepareTable('target');
    }

    prepareModal(connection) {
        this.sourceColumn = connection.sourceColumn;
        this.targetColumn = connection.targetColumn;

        this.joinType = connection.joinType;

        this.sourceTable = connection.sourceTable;
        sortStringValues(this.sourceTable.columns, "name").forEach(
            item => {
                item.label = item.name;
            }
        );

        this.targetTable = connection.targetTable;

        sortStringValues(this.targetTable.columns, "name").forEach(
            item => {
                item.label = item.name;
            }
        );

        this.extraConditions = connection.extraConditions ? connection.extraConditions : [];
        this.joinRule = connection.extraConditionsFormula;
    }

    prepareTable(type) {
        let tableId = this.connection[type + 'Id'].slice(7);
        const table = this.tables.find(table => table.id == tableId);
        sortStringValues(table.columns, "name");
        this[type + 'Table'] = table;
    }

    validateConnection(connection = false) {
        return this.TableRelationService.getAll()
            .then(relations => {
                if (!this.sourceColumn || !this.targetColumn) throw 'Columns have not been selected';
                var valid;
                var relation = relations.find(relation => {
                    return relation.isSameRelation({
                        sourceColumn: this.sourceColumn,
                        targetColumn: this.targetColumn,
                        joinType: this.joinType
                    });
                });

                // This is removed as part of #1679 because we now want to
                // be able to define same relationship multiple times

                // if (relation && connection) {
                //     valid = relation.id == connection.id;
                // } else {
                //     valid = !relation;
                // }
                //
                // if (!valid) {
                //     this.form.source.$invalid = true;
                //     this.form.target.$invalid = true;
                //     this.form.existingConnection = true;
                //     throw 'Connection already exists';
                // }
                return true;

            });
    }

    update() {
        this.submitted = true;
        if (this.form.$invalid) return;

        this.isExtraConditionLoading = true;
        this.loading = true;

        this.validateConnection(this.connection.relation)
            .then((valid) => {
                this.loading = true;
                this.connection.relation.joinType = this.joinType;
                this.connection.relation.sourceColumn = this.sourceColumn;
                this.connection.relation.targetColumn = this.targetColumn;
                this.connection.relation.extraConditions = this.extraConditions;
                this.connection.relation.extraConditionsFormula = this.joinRule;
                this.oldConnection = angular.copy(this.connection);

                return this.PlumbService.update(this.connection, this.oldConnection).then(() => {

                    this.toaster.success('Connection updated');
                    this.submitted = false;
                    this.isDoAnyAction = true;

                }).catch(() => {
                    this.toaster.error('Error occurred, please try again');
                });

            })
            .catch((e) => this.toaster.error(e))
            .finally(() => {
                this.loading = false;
                this.isExtraConditionLoading = false;
                this.submitted = false;
            });
    }

    connect() {
        this.submitted = true;
        if (this.form.$invalid) return;

        this.loading = true;

        let connectionParams = {
            source: this.connection.sourceId,
            target: this.connection.targetId,
            sourceColumn: this.sourceColumn,
            targetColumn: this.targetColumn,
            sourceTable: this.sourceTable,
            targetTable: this.targetTable,
            joinType: this.joinType,
            extraConditions: []
        };
        this.validateConnection().then((valid) => {
                return this.PlumbService.connectTableRelation(connectionParams).then((relation) => {
                    if (relation) {
                        this.connection.relation = relation;
                        this.isDoAnyAction = true;
                        this.toaster.success('Connection established');
                    }
                }).catch(() => {
                    this.toaster.error('Error occurred, please try again');
                });
            })
            .catch((e) => this.toaster.error(e))
            .finally(() => {
                this.loading = false;
                this.submitted = false;
            });

    }

    dismiss() {

        this.modal.dismiss();
    }

    detach() {
        this.loading = true;
        this.PlumbService.detach(this.connection)
            .then(() => {
                this.toaster.success('Connection deleted');
                this.dismiss();
            })
            .catch(() => this.toaster.error('Error occurred, please try again'))
            .finally(() => this.loading = false);
    }

    cancel() {
        this.dismiss();
    }


    deleteExtraCondition(extraCondition) {
        let index = this.extraConditions.findIndex(item => item.chainLetter == extraCondition.chainLetter);
        this.extraConditions.splice(index, 1);

        let letter = 'A';
        this.extraConditions.forEach((item, index)=> {
            if (index === 0) {
                item.chainLetter = letter;
            } else {
                item.chainLetter = this.getNextChainLetter(letter);
                letter = item.chainLetter;
            }

        });

    }

    addAnotherCondition() {
        let data = {};
        data.chainLetter = !this.extraConditions.length ? 'A' : this.getNextAvailableChainLetter(this.extraConditions);
        data.tableRelationId = this.connection.relation.id;

        this.extraConditions.push(new TableRelationExtraConditionModel(data));
    }

    getNextChainLetter(letter) {
        let index = Helpers.alphabet.indexOf(letter);
        return Helpers.alphabet[index + 1];
    }

    getNextAvailableChainLetter(extraConditions = this.extraConditions) {
        let letter;
        for (var key in Helpers.alphabet) {
            letter = Helpers.alphabet[key];
            if (!extraConditions.find(extraCondition => extraCondition.chainLetter == letter)) {
                break;
            }
        }
        return letter;
    }

    hasError(fieldName) {
        return this.form[fieldName] && this.form[fieldName].$error;
    }

    isDirty(fieldName) {
        return this.form[fieldName] && this.form[fieldName].$dirty;
    }
}
