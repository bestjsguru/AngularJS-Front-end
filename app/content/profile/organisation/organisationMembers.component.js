'use strict';

import {Config} from '../../config';
import './permissions/permissions.component';
import './filters/user/userFilterButton.component';

class DeleteMemberModal {
    constructor(user, member, members, callback) {
        this.user = user;
        this.member = member;
        this.members = members.filter(user => user.isAdmin());
        this.callback = callback;
    }

    delete() {
        this.validate();

        if(!this.form.$invalid) this.callback(this.member, this.owner);
    }

    validate() {
        if (this.form.owner.$dirty && this.form.owner.$valid) return false;

        this.form.owner.$dirty = true;
        this.form.owner.$pristine = false;

        return true;
    }

    takeOwnership() {
        this.owner = this.members.find(member => member.id === this.user.id);
    }

}

class OrganisationMembers {
    constructor(OrganisationService, Auth, toaster, $confirm, $uibModal, OrganisationGroupsService) {
        this.Auth = Auth;
        /** @type {OrganisationService} **/
        this.OrganisationService = OrganisationService;
        this.OrganisationGroupsService = OrganisationGroupsService;
        this.toaster = toaster;
        this.members = [];
        this.$confirm = $confirm;
        this.$uibModal = $uibModal;
        this.user = this.Auth.user;
        this.host = window.location.host;
        
        this.show = {
            organisation: true,
            staff: false,
            external: false,
            invites: false
        };
    
        this.OrganisationService.load().then((organisation) => {
            this.organisation = organisation;
            this.refreshMembers();
        });
    
        this.groups = [];
        this.OrganisationGroupsService.getAll().then(groups => {
            this.groups = groups;
        })
    }
    
    countMembers(type) {
        switch(type) {
            case 'organisation':
                return this.members.filter(user => !user.isStaff() && !user.isExternal() && !user.isInvite()).length;
            case 'external':
                return this.members.filter(user => user.isExternal()).length;
            case 'staff':
                return this.members.filter(user => user.isStaff()).length;
            case 'invites':
                return this.members.filter(user => user.isInvite()).length;
        }
    }

    filteredMembers() {
        return this.members.filter(user => {
            if(!this.show.organisation) return user.isStaff() || user.isExternal() || user.isInvite();
            
            return true;
        }).filter(user => {
            if(!this.show.external) return !user.isExternal();
    
            return true;
        }).filter(user => {
            if(!this.show.staff) return !user.isStaff();
    
            return true;
        }).filter(user => {
            if(!this.show.invites) return !user.isInvite();
    
            return true;
        });
    }

    get title() {
        return this.organisation && this.organisation.name;
    }

    get subTitle() {
        if (this.organisation && this.organisation.users && this.organisation.users.length) {
            if (this.organisation.users.length == 1) return '1 member';

            return this.organisation.users.length + ' members';
        }
    }

    refreshMembers() {
        this.membersLoaded = false;
        
        this.OrganisationService.loadUsers().then((users) => {
            this.membersLoaded = true;
            
            this.organisation.setUsers(users);
            this.members = users;
        });
    }

    delete(member, owner) {
        this.OrganisationService.deleteMember(this.organisation, member, owner).then(() => {
            this.modalInstance.dismiss();
            this.refreshMembers();
            this.toaster.success('Member was deleted');
        }).catch((error) => {
            console.error(error);
            this.toaster.error('This user cannot be deleted. Please contact your administrator for more details.');
        });
    }

    selectOwnerFor(member) {

        this.modalInstance && this.modalInstance.dismiss();

        this.modalInstance = this.$uibModal.open({
            templateUrl: 'content/profile/organisation/members/deleteMember.html',
            size: 'md',
            controllerAs: 'modal',
            bindToController: true,
            controller: DeleteMemberModal,
            resolve: {
                user: () => this.user,
                member: () => member,
                members: () => this.members,
                callback: () => this.delete.bind(this)
            }
        });
    }
    
    showPermissionsModal(member) {

        this.modalInstance && this.modalInstance.dismiss();

        this.modalInstance = this.$uibModal.open({
            size: 'lg',
            component: 'appPermissions',
            resolve: {
                member: () => member,
            }
        });
    }

    cancelInvite(member) {
        this.OrganisationService.cancelInvite(member).then(() => {
            this.refreshMembers();
            this.toaster.success('Invitation was canceled');
        }).catch((error)=> {
            this.toaster.error(error.message);
        });
    }

    resendInvite(member) {
        return this.OrganisationService.resendInvite(member).then(() => {
            this.toaster.success('Invitation has been resent to ' + member.email);
        }).catch((error)=> {
            this.toaster.error(error.message);
        });
    }
    
    memberGroups(member) {
        return this.groups.filter(group => group.users.includes(member.id));
    }
}

truedashApp.component('tuOrganisationMembers', {
    templateUrl: 'content/profile/organisation/members.html',
    controller: OrganisationMembers
});
