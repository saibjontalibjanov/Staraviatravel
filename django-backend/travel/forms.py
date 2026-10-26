import re
from django import forms
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.models import User, Group
from travel.models import Lead, HotFlight, Booking, SavedSearch
from travel.services.validation import phone, ServiceError

class StaffLoginForm(AuthenticationForm):
    def confirm_login_allowed(self,user):
        super().confirm_login_allowed(user)
        if not user.is_staff: raise forms.ValidationError('This account does not have staff access.',code='invalid_login')

class LeadForm(forms.ModelForm):
    class Meta:
        model=Lead
        fields=['first_name','last_name','phone','email','source','language','lead_status','assigned_to','flight_route','airline','quoted_price','payment_method','departure_airport','arrival_airport','departure_date','return_date','passengers','cabin','notes']
        widgets={'departure_date':forms.DateInput(attrs={'type':'date'}),'return_date':forms.DateInput(attrs={'type':'date'}),'notes':forms.Textarea(attrs={'rows':4})}
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.fields['assigned_to'].queryset=User.objects.filter(is_staff=True,is_active=True)
    def clean_phone(self):
        try:return phone(self.cleaned_data['phone'])
        except ServiceError as error:raise forms.ValidationError(error.message)
    def clean(self):
        data=super().clean()
        for key in ['departure_airport','arrival_airport']:
            value=(data.get(key) or '').upper()
            if value and not re.fullmatch('[A-Z]{3}',value):self.add_error(key,'Use a three-letter IATA code.')
            data[key]=value
        if data.get('departure_date') and data.get('return_date') and data['return_date']<data['departure_date']:self.add_error('return_date','Return must follow departure.')
        if data.get('passengers') is not None and not 1<=data['passengers']<=9:self.add_error('passengers','Use 1–9 passengers.')
        if data.get('quoted_price') is not None and data['quoted_price']<0:self.add_error('quoted_price','Use a non-negative amount.')
        return data

class HotFlightForm(forms.ModelForm):
    class Meta:
        model=HotFlight
        fields=['title','type','badge','price','old_price','image','background','link','badge_color','published']
        widgets={'title':forms.TextInput(),'type':forms.TextInput(),'badge':forms.TextInput()}
    def clean_link(self):
        value=self.cleaned_data.get('link','')
        if value and not(value.startswith('/') and not value.startswith('//') or value.startswith('https://')):raise forms.ValidationError('Use a relative website path or HTTPS link.')
        return value
    def clean(self):
        data=super().clean()
        for key in ['image','background']:
            file=data.get(key)
            if file and getattr(file,'size',0)>8*1024*1024:self.add_error(key,'Maximum image size is 8 MB.')
        return data

class BookingForm(forms.ModelForm):
    class Meta:
        model=Booking
        fields=['passenger_name','passport_number','flight_id','paid_price','published']
    def clean_paid_price(self):
        value=self.cleaned_data.get('paid_price')
        if value is not None and value<0:raise forms.ValidationError('Price must not be negative.')
        return value

class SavedSearchForm(forms.ModelForm):
    class Meta:
        model=SavedSearch
        fields=['from_location','to_location','departure_date','published']
        widgets={'departure_date':forms.DateInput(attrs={'type':'date'})}

class StaffCreationForm(UserCreationForm):
    role=forms.ModelChoiceField(queryset=Group.objects.none())
    class Meta(UserCreationForm.Meta):
        model=User
        fields=['username','first_name','last_name','email','role','password1','password2']
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs);self.fields['role'].queryset=Group.objects.filter(name__in=['Agents','Managers'])
    def save(self,commit=True):
        user=super().save(commit=False);user.is_staff=True
        if commit:user.save();user.groups.add(self.cleaned_data['role'])
        return user
