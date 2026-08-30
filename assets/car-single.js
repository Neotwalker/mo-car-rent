(() => {
  'use strict';
  const forms=[...document.querySelectorAll('[data-car-booking-form]')];
  if(!forms.length) return;
  const iso=(d)=>{const off=d.getTimezoneOffset()*60000;return new Date(d.getTime()-off).toISOString().slice(0,10)};
  const today=iso(new Date());
  const PHONE_RULES={
    '66':{max:9, pattern:[2,3,4]}, '7':{max:10, pattern:[3,3,2,2], paren:true}, '1':{max:10, pattern:[3,3,4], paren:true},
    '44':{max:10, pattern:[4,6]}, '49':{max:11, pattern:[3,4,4]}, '33':{max:9, pattern:[1,2,2,2,2]}, '971':{max:9, pattern:[2,3,4]},
  };
  const digits=v=>(v||'').replace(/\D/g,'');
  const group=(v,sizes)=>{let out=[],p=0;for(const s of sizes){if(p>=v.length)break;out.push(v.slice(p,p+s));p+=s;}if(p<v.length)out.push(v.slice(p));return out};
  const formatLocal=(value, code)=>{
    const rule=PHONE_RULES[code]||{max:12,pattern:[3,3,3,3]}; let d=digits(value).slice(0,rule.max); if(!d)return '';
    if(rule.paren){const a=d.slice(0,3), rest=d.slice(3); let o=a?`(${a}${a.length===3?')':''}`:''; if(rest){const g=group(rest,rule.pattern.slice(1)); o+=` ${g.join('-')}`;} return o;}
    return group(d,rule.pattern).join(' ');
  };
  forms.forEach(form=>{
    const pickup=form.querySelector('[data-car-pickup-date]'), ret=form.querySelector('[data-car-return-date]'), method=form.querySelector('[data-car-pickup-method]');
    const addressField=form.querySelector('[data-delivery-address-field]'), address=addressField?.querySelector('input');
    const country=form.querySelector('[data-phone-country]'), local=form.querySelector('[data-phone-local]'), full=form.querySelector('[data-phone-full]');
    const status=form.querySelector('[data-car-booking-status]');
    const shell=form.closest('.booking-card__form-shell'), success=shell?.querySelector('[data-booking-success]');
    const steps=[...form.querySelectorAll('[data-quiz-step]')]; const progress=[...form.querySelectorAll('[data-quiz-progress]')]; let step=0; let timer=0;
    if(pickup)pickup.min=today;if(ret)ret.min=today;
    const syncDates=()=>{if(!pickup||!ret)return; ret.min=pickup.value||today; if(ret.value && ret.value<ret.min)ret.value='';};
    const syncDelivery=()=>{if(!method||!addressField||!address)return; const req=method.value==='delivery';addressField.hidden=!req;address.required=req;if(!req)address.value='';};
    const syncPhone=()=>{if(!local||!country)return; const code=country.value; const formatted=formatLocal(local.value,code); local.value=formatted; const d=digits(formatted); const rule=PHONE_RULES[code]||{max:12}; const valid=d.length>=Math.min(7,rule.max) && d.length<=rule.max; local.setCustomValidity(valid||!formatted?'':'Введите номер целиком.'); if(full)full.value=formatted?`+${code} ${formatted}`:'';};
    country?.addEventListener('change',()=>{local.value='';syncPhone();local.focus();});
    local?.addEventListener('input',syncPhone);
    local?.addEventListener('keydown',e=>{if(e.key==='Backspace' && local.selectionStart===local.selectionEnd && local.selectionStart>0){/* native deletion, formatter rebuilds */}});
    pickup?.addEventListener('change',syncDates);method?.addEventListener('change',syncDelivery);
    form.querySelectorAll('[data-car-date-trigger]').forEach(btn=>btn.addEventListener('click',()=>{const input=btn.closest('[data-car-date-control]')?.querySelector('input[type=date]');input?.focus({preventScroll:true});try{input?.showPicker?.()}catch{}}));
    const showStep=(n)=>{step=Math.max(0,Math.min(steps.length-1,n));steps.forEach((el,i)=>el.hidden=i!==step);progress.forEach((el,i)=>el.classList.toggle('is-active',i<=step));form.dataset.quizStep=String(step+1);};
    const validateStep=()=>{const required=[...steps[step].querySelectorAll('[required]')].filter(el=>!el.closest('[hidden]')); for(const field of required){if(!field.checkValidity()){field.setAttribute('aria-invalid','true');field.reportValidity();field.focus({preventScroll:true});return false;}field.removeAttribute('aria-invalid');}return true;};
    form.querySelectorAll('[data-quiz-next]').forEach(b=>b.addEventListener('click',()=>{syncPhone();if(validateStep())showStep(step+1)}));
    form.querySelectorAll('[data-quiz-prev]').forEach(b=>b.addEventListener('click',()=>showStep(step-1)));
    const hideSuccess=()=>{if(!success)return;success.classList.remove('is-visible');setTimeout(()=>{success.hidden=true;form.reset();showStep(0);syncDates();syncDelivery();syncPhone();},180)};
    const showSuccess=()=>{if(!success)return;clearTimeout(timer);success.hidden=false;requestAnimationFrame(()=>success.classList.add('is-visible'));timer=setTimeout(hideSuccess,6000)};
    form.addEventListener('submit',e=>{e.preventDefault();syncPhone();if(!validateStep())return; const detail=Object.fromEntries(new FormData(form).entries());detail.messengers=[...form.querySelectorAll('[name="messengers"]:checked')].map(x=>x.value);document.dispatchEvent(new CustomEvent('mocar:booking_submit',{detail}));if(form.hasAttribute('data-demo'))showSuccess();});
    syncDates();syncDelivery();syncPhone();showStep(0);
  });
})();